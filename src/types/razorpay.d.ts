export {}

interface RazorpayInstance {
  open: () => void
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance
  }
}
