import { useState } from 'react';
import { X } from 'lucide-react';
import type { CustomerWithStats, Address } from '@groundup/shared-types';
import './CustomerEditModal.css';

type Props = {
  customer: CustomerWithStats | null;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    loyaltyPoints: number;
    dietaryNotes: string;
    address: Address;
  }) => Promise<void>;
};

export default function CustomerEditModal({ customer, onClose, onSave }: Props) {
  const [firstName, setFirstName] = useState(customer?.firstName ?? '');
  const [lastName, setLastName] = useState(customer?.lastName ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [loyaltyPoints, setLoyaltyPoints] = useState(String(customer?.loyaltyPoints ?? 0));
  const [dietaryNotes, setDietaryNotes] = useState(customer?.dietaryNotes ?? '');
  const [street, setStreet] = useState(customer?.address?.street ?? '');
  const [city, setCity] = useState(customer?.address?.city ?? '');
  const [zip, setZip] = useState(customer?.address?.zip ?? '');
  const [saving, setSaving] = useState(false);

  const isEdit = customer !== null;

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        loyaltyPoints: parseInt(loyaltyPoints, 10) || 0,
        dietaryNotes: dietaryNotes.trim(),
        address: { street: street.trim(), city: city.trim(), state: 'NJ', zip: zip.trim() },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-head">
          <h2>{isEdit ? 'Edit customer' : 'Add customer'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="edit-modal-row">
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="edit-modal-row">
          <input
            placeholder="Loyalty points"
            type="number"
            value={loyaltyPoints}
            onChange={(e) => setLoyaltyPoints(e.target.value)}
          />
          <input
            placeholder="Dietary notes"
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
          />
        </div>

        <input
          placeholder="Street address"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
        <div className="edit-modal-row">
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input placeholder="Zip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>

        <div className="edit-modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving || !firstName.trim() || !lastName.trim()}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
