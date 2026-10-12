import UIKit
import WebKit
import Capacitor

// the game view: edge swipes reach the game first (a second swipe still goes home),
// and the page can ask for a buzz through window.webkit.messageHandlers.haptics
class GameViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let heavy = UIImpactFeedbackGenerator(style: .heavy)

    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { return .all }
    override var prefersHomeIndicatorAutoHidden: Bool { return true }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        webView?.scrollView.bounces = false
        webView?.configuration.userContentController.add(self, name: "haptics")
    }

    // the page sends a buzz length in milliseconds; longer buzzes hit harder
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let ms = (message.body as? NSNumber)?.intValue ?? 0
        if ms >= 45 { heavy.impactOccurred() } else if ms >= 18 { medium.impactOccurred() } else { light.impactOccurred() }
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = GameViewController()
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
