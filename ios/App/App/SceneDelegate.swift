import UIKit
import WebKit
import Capacitor

// the game view: the page can ask for a buzz through window.webkit.messageHandlers.haptics,
// and shows the status bar in menus through window.webkit.messageHandlers.statusBar
class GameViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)
    var onStatusBar: ((Bool) -> Void)?

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.scrollView.bounces = false
        webView?.configuration.userContentController.add(self, name: "haptics")
        webView?.configuration.userContentController.add(self, name: "statusBar")
    }

    // statusBar: true in menus, false on the road. haptics: a buzz length in milliseconds; longer buzzes hit harder
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "statusBar" {
            onStatusBar?((message.body as? NSNumber)?.boolValue ?? false)
            return
        }
        let ms = (message.body as? NSNumber)?.intValue ?? 0
        if ms >= 45 { heavy.impactOccurred() } else if ms >= 18 { medium.impactOccurred() } else { light.impactOccurred() }
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
    override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation { return .fade }

    override func viewDidLoad() {
        super.viewDidLoad()
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

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
