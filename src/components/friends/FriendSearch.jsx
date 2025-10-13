import { useCallback, useState } from "react";
import { useToast } from "../../contexts/useToast";
import api from "../../lib/axios";
import Button from "../ui/Button";
import Card from "../ui/Card";

// Debounce helper
function useDebounce(callback, delay) {
  const [timer, setTimer] = useState(null);

  return useCallback((...args) => {
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => callback(...args), delay);
    setTimer(newTimer);
  }, [callback, delay, timer]);
}

export default function FriendSearch() {
  
  const { toast } = useToast();
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null); // userId being sent request

  // Debounced search function
  const performSearch = useCallback(async (searchTerm) => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      const data = res.data?.data || res.data || [];
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(performSearch, 300);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const sendRequest = async (recipientEmail, recipientId) => {
    try {
      setSending(recipientId);
      await api.post("/friends/send", { email: recipientEmail });
      toast.success("Friend request sent");
      // Remove from results
      setResults(prev => prev.filter(u => u._id !== recipientId));
    } catch (err) {
      const msg = err?.message || "Failed to send request";
      if (msg.includes("already")) {
        toast.info(msg);
        setResults(prev => prev.filter(u => u._id !== recipientId));
      } else {
        toast.error(msg);
      }
    } finally {
      setSending(null);
    }
  };

  return (
    <Card className="p-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-semibold mb-3">Find Friends</h3>
      
      <input
        type="text"
        className="input mb-3"
        placeholder="Search by name or email..."
        value={query}
        onChange={handleQueryChange}
      />

      {loading && (
        <div className="text-sm text-secondary text-center py-4">
          Searching...
        </div>
      )}

      {!loading && query.length > 0 && query.length < 2 && (
        <div className="text-sm text-secondary text-center py-4">
          Type at least 2 characters to search
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="text-sm text-secondary text-center py-4">
          No users found matching "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map(u => {
            const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
            return (
              <div 
                key={u._id}
                className="flex items-center justify-between gap-3 border border-[--color-border-muted] rounded-[var(--radius-standard)] p-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{name}</div>
                  <div className="text-xs text-secondary truncate">{u.email}</div>
                </div>
                <Button 
                  className="btn-sm"
                  onClick={() => sendRequest(u.email, u._id)}
                  disabled={sending === u._id}
                >
                  {sending === u._id ? "Sending..." : "Add Friend"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}