export default function Skills({ groups, favorites }) {
  return (
    <ul className="skills">
      {groups.map((g) => (
        <li key={g.id} className="skills__group">
          <h3 className="skills__title"><span aria-hidden="true">{g.icon}</span> {g.title}</h3>
          <ul className="tags tags--large">
            {g.items.map((item) => (
              <li key={item} className={favorites.includes(item) ? 'is-favorite' : ''}>
                {item}{favorites.includes(item) && <span aria-label="favorite"> ★</span>}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
