import { AlertTriangle, Smartphone, AlertCircle, RefreshCw, Check } from 'lucide-react'

const SETUP_CONTENT = {
  checking: {
    icon: RefreshCw,
    title: 'Checking for phone...',
    description: 'Looking for a connected device.'
  },
  connected: {
    icon: Check,
    title: 'Phone detected',
    description: 'Your phone is connected over USB and ready for backup.'
  },
  adb_not_found: {
    icon: AlertTriangle,
    title: 'ADB not detected',
    description: 'PhoneSync bundles ADB, but it needs to be downloaded first.'
  },
  no_device: {
    icon: Smartphone,
    title: 'Phone not detected',
    description: 'Connect your phone to get started.'
  },
  adb_error: {
    icon: AlertCircle,
    title: 'ADB error',
    description: 'Please reconnect your phone and restart the app.'
  }
}

export function SetupGuide({ status, connectionType = 'usb' }) {
  const content = SETUP_CONTENT[status] || SETUP_CONTENT.adb_error
  const Icon = content.icon
  const description = status === 'connected' && connectionType === 'wifi'
    ? 'Your phone is connected over Wi-Fi and ready for backup.'
    : content.description

  return (
    <div className="space-y-3">
      <div className="card !bg-primary !text-white !border-primary/30">
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
          <div>
            <h2 className="text-lg font-semibold mb-1">{content.title}</h2>
            <p className="text-sm text-white/80">{description}</p>
          </div>
        </div>
      </div>

      {status === 'adb_not_found' && (
        <div className="card">
          <p className="font-medium text-taupe-700 dark:text-taupe-200 mb-3">Install ADB manually:</p>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-taupe-600 dark:text-taupe-400">
            <li>
              Download <a href="https://developer.android.com/studio/releases/platform-tools" target="_blank" className="text-primary underline">Android Platform Tools</a>
            </li>
            <li>Extract the zip somewhere on your PC</li>
            <li>Add the folder to your system PATH</li>
            <li>Restart PhoneSync</li>
          </ol>
        </div>
      )}

      {status === 'no_device' && (
        <div className="card">
          <p className="font-semibold text-taupe-700 dark:text-taupe-200 mb-3">One-time setup on your Android phone:</p>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-taupe-600 dark:text-taupe-400">
            <li>Open <strong>Settings → About phone</strong></li>
            <li>Tap <strong>"Build number"</strong> 7 times (you'll see "You are now a developer")</li>
            <li>Go back → <strong>System → Developer options</strong></li>
            <li>Enable <strong>USB debugging</strong></li>
            <li>Plug in your phone via USB cable</li>
            <li>Set the USB mode to <strong>"File transfer"</strong></li>
            <li>Accept the <strong>RSA key fingerprint</strong> prompt on your phone</li>
          </ol>
          <p className="text-xs text-taupe-400 mt-4">After connecting, the app will detect your phone automatically.</p>

        </div>
      )}
    </div>
  )
}
