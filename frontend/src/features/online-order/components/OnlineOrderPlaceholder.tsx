import { Globe } from 'lucide-react';

export default function OnlineOrderPlaceholder() {
  return (
    <div className="online-placeholder">
      <Globe size={40} strokeWidth={1.5} />
      <h1>Online Ordering</h1>
      <p>Customer-facing ordering isn't built yet — this is where it'll live.</p>
    </div>
  );
}
