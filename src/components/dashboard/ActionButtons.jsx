import { useNavigate } from "react-router-dom";

export default function ActionButtons() {
  const nav = useNavigate();
  const base = "btn btn-primary w-full";

  return (
    <div className="mt-4 grid gap-3 sm:max-w-md sm:mx-auto md:max-w-none md:grid-cols-3">
      <button className={base} onClick={() => nav("/matches/new")}>
        Add New Game
      </button>
      <button className={base} onClick={() => nav("/friends")}>
        Friends List
      </button>
      <button className={base} onClick={() => nav("/matches")}>
        Match History
      </button>
    </div>
  );
}