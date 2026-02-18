
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FormField from "../components/forms/FormField";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
import { useFormValidation } from "../hooks/useFormValidation";
import { validateGameName, validatePlayerCount } from "../utils/validators";
import api from "../lib/axios";

export default function AddGamePage() {
  const nav = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  // Validation function
  const validateForm = (values) => {
    const errors = {};
    
    // Validate game name
    const nameCheck = validateGameName(values.name);
    if (!nameCheck.ok) errors.name = nameCheck.message;
    
    // Validate player counts
    const playerCheck = validatePlayerCount(values.minPlayers, values.maxPlayers);
    if (!playerCheck.ok) {
      errors[playerCheck.field] = playerCheck.message;
    }
    
    return { ok: Object.keys(errors).length === 0, errors };
  };

  // Use form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldTouched,
    validateForm: validate,
    setIsSubmitting,
  } = useFormValidation(
    {
      name: "",
      category: "Other",
      minPlayers: 2,
      maxPlayers: 4,
    },
    validateForm
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to show errors
    setFieldTouched('name', true);
    setFieldTouched('minPlayers', true);
    setFieldTouched('maxPlayers', true);
    
    // Validate form
    const result = validate();
    if (!result.ok) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const res = await api.post("/games", {
        name: values.name.trim(),
        category: values.category,
        minPlayers: parseInt(values.minPlayers),
        maxPlayers: parseInt(values.maxPlayers),
      });
      
      const game = res?.data?.data || res?.data;
      toast.success("Game added!");
      nav("/matches/new", { state: { justAddedGameId: game?._id } });
      
    } catch (error) {
      console.error('Add game error:', error);
      
      const msg = error?.response?.data?.message || error?.message || "Failed to add game.";
      toast.error(msg);
      
      const status = error?.response?.status;
      if (status === 401 || /unauthorized/i.test(msg)) {
        nav("/login", { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?._id) {
    return (
      <main className="py-2 lg:py-6">
        <Card className="p-6 max-w-md mx-auto text-center">
          <p className="text-secondary mb-3">Please sign in to add a game.</p>
          <Link to="/login" className="underline" style={{ color: "var(--color-cta)" }}>
            Go to login
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="py-2 lg:py-6">
      <Card className="p-6 max-w-md mx-auto">
        <h1 className="h1 mb-2">Add a game</h1>
        <p className="text-secondary mb-4">Create a new game so you can log matches against it.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            label="Game name"
            name="name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
            touched={touched.name}
            placeholder="e.g., Chess, FIFA 24, Catan"
            required
          />

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-primary)' }}>
              Category
              <span className="text-[var(--color-warning)] ml-1">*</span>
            </label>
            <select
              name="category"
              value={values.category}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="Card">Card</option>
              <option value="Board">Board</option>
              <option value="Dice">Dice</option>
              <option value="Word">Word</option>
              <option value="Strategy">Strategy</option>
              <option value="Trivia">Trivia</option>
              <option value="Party">Party</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Min Players"
              name="minPlayers"
              type="number"
              value={values.minPlayers}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.minPlayers}
              touched={touched.minPlayers}
              min="1"
              max="100"
              required
            />
            <FormField
              label="Max Players"
              name="maxPlayers"
              type="number"
              value={values.maxPlayers}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.maxPlayers}
              touched={touched.maxPlayers}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !values.name.trim()}
              loading={isSubmitting}
            >
              Add game
            </Button>
            <Link to="/matches/new" className="underline text-sm" style={{ color: "var(--color-cta)" }}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}