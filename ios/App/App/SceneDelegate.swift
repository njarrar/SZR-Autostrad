import UIKit
import WebKit
import AVFoundation
import Capacitor

// Prevents WKUserContentController from strongly retaining the view controller
private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?
    init(_ delegate: WKScriptMessageHandler) { self.delegate = delegate }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

// the game view: handles haptics, statusBar visibility, dynamic keepAwake, and AVAudioSession interruptions
class GameViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    private var interruptionObserver: NSObjectProtocol?
    var onStatusBar: ((Bool) -> Void)?

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        light.prepare()
        medium.prepare()
        heavy.prepare()

        if let wv = webView {
            wv.allowsLinkPreview = false
            wv.scrollView.bounces = false
            wv.scrollView.minimumZoomScale = 1.0
            wv.scrollView.maximumZoomScale = 1.0
            wv.scrollView.pinchGestureRecognizer?.isEnabled = false
            wv.scrollView.showsVerticalScrollIndicator = false
            wv.scrollView.showsHorizontalScrollIndicator = false

            let weakHandler = WeakScriptMessageHandler(self)
            let ucc = wv.configuration.userContentController
            ucc.add(weakHandler, name: "haptics")
            ucc.add(weakHandler, name: "statusBar")
            ucc.add(weakHandler, name: "keepAwake")
        }

        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] note in
            guard let info = note.userInfo,
                  let raw = info[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
            if type == .began {
                self?.webView?.evaluateJavaScript("window.autostradAudioActive && window.autostradAudioActive(false)", completionHandler: nil)
            } else if type == .ended {
                try? AVAudioSession.sharedInstance().setActive(true)
                self?.webView?.evaluateJavaScript("window.autostradAudioActive && window.autostradAudioActive(true)", completionHandler: nil)
            }
        }
    }

    deinit {
        if let obs = interruptionObserver {
            NotificationCenter.default.removeObserver(obs)
        }
        if let ucc = webView?.configuration.userContentController {
            ucc.removeScriptMessageHandler(forName: "haptics")
            ucc.removeScriptMessageHandler(forName: "statusBar")
            ucc.removeScriptMessageHandler(forName: "keepAwake")
        }
    }

    private func fireImpact(ms: Int) {
        if ms >= 45 { heavy.impactOccurred(); heavy.prepare() }
        else if ms >= 18 { medium.impactOccurred(); medium.prepare() }
        else if ms > 0 { light.impactOccurred(); light.prepare() }
    }

    // statusBar: true in menus, false on the road.
    // keepAwake: true only while actively driving.
    // haptics: single ms number or [pulseMs, pauseMs, pulseMs, ...] pattern array.
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "statusBar" {
            onStatusBar?((message.body as? NSNumber)?.boolValue ?? false)
            return
        }
        if message.name == "keepAwake" {
            UIApplication.shared.isIdleTimerDisabled = (message.body as? NSNumber)?.boolValue ?? false
            return
        }
        if let pattern = message.body as? [NSNumber] {
            var delayMs = 0
            for (idx, val) in pattern.enumerated() {
                let dur = max(0, val.intValue)
                if idx % 2 == 0 {
                    let wait = delayMs
                    if wait == 0 { fireImpact(ms: dur) }
                    else {
                        DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(wait)) { [weak self] in
                            self?.fireImpact(ms: dur)
                        }
                    }
                }
                delayMs += dur
            }
            return
        }
        let ms = (message.body as? NSNumber)?.intValue ?? 0
        fireImpact(ms: ms)
    }
}

// holds the game and answers the screen questions Capacitor's own view won't let us change:
// edge swipes reach the game first (a second swipe still goes home), the home bar hides,
// and the status bar shows only when the page asks for it
class GameHostController: UIViewController {
    private let game = GameViewController()
    private var showStatus = false

    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .all }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }
    override var prefersStatusBarHidden: Bool { return !showStatus }
    override var preferredStatusBarStyle: UIStatusBarStyle { return .lightContent }
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation { return .fade }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 11.0 / 255.0, green: 107.0 / 255.0, blue: 58.0 / 255.0, alpha: 1.0)
        addChild(game)
        game.view.frame = view.bounds
        game.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(game.view)
        game.didMove(toParent: self)
        game.onStatusBar = { [weak self] show in
            guard let self = self, show != self.showStatus else { return }
            self.showStatus = show
            UIView.animate(withDuration: 0.2) { self.setNeedsStatusBarAppearanceUpdate() }
        }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = GameHostController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        UIApplication.shared.isIdleTimerDisabled = false
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
