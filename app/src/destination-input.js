import { DESTINATIONS } from './navigation.js';

const labels = Object.keys(DESTINATIONS);
const rooms = labels.filter(label => /^\d{3}$/.test(label));
const facilities = labels.filter(label => label.includes(' · ')).map(label => {
    const [name, floor] = label.split(' · ');
    const base = name.toLowerCase().replace(/\s/g, '');
    return { label, floor: floor[0], aliases: base === 'elevator' ? [base, 'lift'] : [base] };
});

export function matchDestinationInput(value) {
    if (typeof value !== 'string') return { label: null, suggestions: [] };
    const text = value.normalize('NFKC').trim().toLowerCase();
    const room = text.replace(/^room\s*/, '');
    if (/^\d+$/.test(room)) {
        const label = rooms.includes(room) ? room : null;
        return { label, suggestions: label ? [] : rooms.filter(name => name.startsWith(room)).slice(0, 3) };
    }
    const key = text.replace(/[\s·.\-–—/(),]/g, '').replace(/floor(\d+)f?$/, '$1f');
    if (!key) return { label: null, suggestions: [] };
    const match = facilities.find(({ floor, aliases }) =>
        aliases.some(alias => key === alias + floor || key === alias + floor + 'f'));
    if (match) return { label: match.label, suggestions: [] };
    const base = key.replace(/\d+f?$/, '');
    const suggestions = facilities.filter(({ aliases }) =>
        aliases.some(alias => alias.startsWith(key) || alias === base))
        .map(({ label }) => label).slice(0, 3);
    return { label: null, suggestions };
}
