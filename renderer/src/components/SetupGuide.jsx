import { AlertTriangle, Smartphone, AlertCircle, RefreshCw } from 'lucide-react'

const SETUP_CONTENT = {
  checking: {
    icon: RefreshCw,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    title: 'Checking for phone...',
    description: 'Looking for a connected device.'
  },
  adb_not_found: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    title: 'ADB not detected',
    description: 'PhoneSync bundles ADB, but it needs to be downloaded first.'
  },
  no_device: {
    icon: Smartphone,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: 'Phone not detected',
    description: 'Connect your phone to get started.'
  },
  adb_error: {
    icon: AlertCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: 'ADB error',
    description: 'Please reconnect your phone and restart the app.'
  }
}

export function SetupGuide({ status }) {
  const content = SETUP_CONTENT[status] || SETUP_CONTENT.adb_error
  const Icon = content.icon

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-8">
        <Smartphone className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-gray-800">PhoneSync</h1>
      </div>

      <div className={`${content.bgColor} rounded-lg border ${content.borderColor} p-6 mb-6`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-6 h-6 ${content.iconColor} flex-shrink-0 mt-0.5${status === 'checking' ? ' animate-spin' : ''}`} />
          <div>
            <h2 className="text-lg font-semibold mb-1">{content.title}</h2>
            <p className="text-sm text-gray-600">{content.description}</p>
          </div>
        </div>
      </div>

      {status === 'adb_not_found' && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <p className="font-medium mb-3">Install ADB manually:</p>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-600">
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
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
          <p className="font-medium mb-3">One-time setup on your Android phone:</p>
          <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-600">
            <li>Open <strong>Settings → About phone</strong></li>
            <li>Tap <strong>"Build number"</strong> 7 times (you'll see "You are now a developer")</li>
            <li>Go back → <strong>System → Developer options</strong></li>
            <li>Enable <strong>USB debugging</strong></li>
            <li>Plug in your phone via USB cable</li>
            <li>Set the USB mode to <strong>"File transfer"</strong></li>
            <li>Accept the <strong>RSA key fingerprint</strong> prompt on your phone</li>
          </ol>
          <p className="text-xs text-gray-400 mt-4">After connecting, the app will detect your phone automatically.</p>
        </div>
      )}
    </div>
  )
}