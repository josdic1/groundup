import { useMemo, useState } from 'react';
import type { MenuItem, SoldBy } from '@groundup/shared-types';
import { useMenuContext } from '../providers/MenuProvider';
import './MenuPage.css';

const blankItem = {
  name: '',
  category: 'Specials',
  price: 0,
  unit: 'per lb',
  soldBy: 'weight' as SoldBy,
  isActive: true,
};

export default function MenuPage() {
  const { menu, categories, loading, error, saveMenuItem, addMenuItem } = useMenuContext();
  const [draft, setDraft] = useState<Record<string, MenuItem>>({});
  const [newItem, setNewItem] = useState(blankItem);

  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      items: menu.filter((item) => item.category === category),
    }));
  }, [categories, menu]);

  const getItem = (item: MenuItem) => draft[item.id] ?? item;

  const updateDraft = (item: MenuItem, changes: Partial<MenuItem>) => {
    setDraft((prev) => ({
      ...prev,
      [item.id]: { ...getItem(item), ...changes },
    }));
  };

  const save = async (item: MenuItem) => {
    await saveMenuItem(item.id, getItem(item));
    setDraft((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

  const addSpecial = async () => {
    if (!newItem.name.trim()) return;
    await addMenuItem(newItem);
    setNewItem(blankItem);
  };

  if (loading) return <main className="menu-page"><p>Loading menu…</p></main>;
  if (error) return <main className="menu-page"><p>{error}</p></main>;

  return (
    <main className="menu-page">
      <header className="menu-page-header">
        <div>
          <p className="menu-eyebrow">Maple Kosher Meats</p>
          <h1>Menu</h1>
          <p className="menu-subtitle">Edit prices, availability, units, and specials.</p>
        </div>
      </header>

      <section className="menu-add-card">
        <h2>Add Special</h2>
        <div className="menu-add-grid">
          <input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
          <input type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} />
          <input value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
          <select value={newItem.soldBy} onChange={(e) => setNewItem({ ...newItem, soldBy: e.target.value as SoldBy })}>
            <option value="weight">weight</option>
            <option value="each">each</option>
          </select>
          <button onClick={addSpecial}>Add</button>
        </div>
      </section>

      {grouped.map(({ category, items }) => (
        <section className="menu-section" key={category}>
          <h2>{category}</h2>
          <div className="menu-table">
            {items.map((item) => {
              const current = getItem(item);
              const changed = Boolean(draft[item.id]);

              return (
                <div className={`menu-row ${!current.isActive ? 'inactive' : ''}`} key={item.id}>
                  <input value={current.name} onChange={(e) => updateDraft(item, { name: e.target.value })} />
                  <input type="number" step="0.01" value={current.price} onChange={(e) => updateDraft(item, { price: Number(e.target.value) })} />
                  <input value={current.unit} onChange={(e) => updateDraft(item, { unit: e.target.value })} />
                  <select value={current.soldBy} onChange={(e) => updateDraft(item, { soldBy: e.target.value as SoldBy })}>
                    <option value="weight">weight</option>
                    <option value="each">each</option>
                  </select>
                  <button onClick={() => updateDraft(item, { isActive: !current.isActive })}>
                    {current.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button disabled={!changed} onClick={() => save(item)}>Save</button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
