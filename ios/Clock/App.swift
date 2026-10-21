import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = ClockViewController()
        window.makeKeyAndVisible()
        self.window = window
        application.isIdleTimerDisabled = true
        return true
    }
}

final class ClockViewController: UIViewController, WKNavigationDelegate {
    private var server: LocalServer?
    private var webView: WKWebView!

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { [.bottom] }
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask { .portrait }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.addUserScript(WKUserScript(source: "window.CLOCK_NATIVE = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        // Physical view edges, deliberately not the safe-area layout guides.
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        do {
            guard let root = Bundle.main.resourceURL?.appendingPathComponent("Web") else { throw CocoaError(.fileNoSuchFile) }
            server = try LocalServer(root: root)
            server?.start { [weak self] result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let url): self?.webView.load(URLRequest(url: url))
                    case .failure(let error): self?.showError(error)
                    }
                }
            }
        } catch { showError(error) }
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = action.request.url
        decisionHandler(url?.host == "127.0.0.1" || url?.scheme == "about" ? .allow : .cancel)
    }

    private func showError(_ error: Error) {
        let label = UILabel()
        label.text = "Could not open the offline clock.\n\(error.localizedDescription)"
        label.textColor = .white
        label.numberOfLines = 0
        label.textAlignment = .center
        label.frame = view.bounds.insetBy(dx: 28, dy: 80)
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }
}
