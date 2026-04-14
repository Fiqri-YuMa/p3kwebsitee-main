import { toast } from 'sonner';

export function useToast() {
  const showToast = (options: { message: string; title: string; variant?: "success" | "error" }) => {
    const { message, title, variant = "success" } = options;
    toast[variant](`${title}: ${message}`);
  };

  return { showToast };
}
