import { NavLink } from "react-router-dom"

const items = [
  ["/", "Home"],
  ["/notifications", "Notifications"],
  ["/path", "Path"],
  ["/fuel", "Fuel"],
  ["/chat", "Chat"],
]

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        right: 12,
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 8,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 8,
      }}
    >
      {items.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            textAlign: "center",
            textDecoration: "none",
            color: isActive ? "var(--ember)" : "var(--text-mid)",
            fontFamily: '"Geist Mono", monospace',
            fontSize: 12,
            padding: "8px 0",
            borderRadius: 12,
            background: isActive ? "var(--ember-dim)" : "transparent",
          })}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
