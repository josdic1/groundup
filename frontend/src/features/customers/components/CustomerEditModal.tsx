import { useState } from "react";
import { X } from "lucide-react";
import type { CustomerWithStats, Address } from "@groundup/shared-types";

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

export default function CustomerEditModal({
  customer,
  onClose,
  onSave,
}: Props) {
  const [formData, setFormData] = useState({
    firstName: customer?.firstName ?? "",
    lastName: customer?.lastName ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    loyaltyPoints: String(customer?.loyaltyPoints ?? 0),
    dietaryNotes: customer?.dietaryNotes ?? "",
    street: customer?.address?.street ?? "",
    city: customer?.address?.city ?? "",
    zip: customer?.address?.zip ?? "",
  });
  const [saving, setSaving] = useState(false);

  const isEdit = customer !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        loyaltyPoints: parseInt(formData.loyaltyPoints, 10) || 0,
        dietaryNotes: formData.dietaryNotes.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: "NJ",
          zip: formData.zip.trim(),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-head">
          <h2>{isEdit ? "Edit customer" : "Add customer"}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="edit-modal-row">
          <input
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <input
          name="email"
          placeholder="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <div className="edit-modal-row">
          <input
            name="loyaltyPoints"
            placeholder="Loyalty points"
            type="number"
            value={formData.loyaltyPoints}
            onChange={handleChange}
          />
          <input
            name="dietaryNotes"
            placeholder="Dietary notes"
            value={formData.dietaryNotes}
            onChange={handleChange}
          />
        </div>

        <input
          name="street"
          placeholder="Street address"
          value={formData.street}
          onChange={handleChange}
        />
        <div className="edit-modal-row">
          <input
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
          />
          <input
            name="zip"
            placeholder="Zip"
            value={formData.zip}
            onChange={handleChange}
          />
        </div>

        <div className="edit-modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={
              saving || !formData.firstName.trim() || !formData.lastName.trim()
            }
            onClick={handleSave}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
