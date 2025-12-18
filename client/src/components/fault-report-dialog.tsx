import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  symptoms: z.string().min(5, "Veuillez décrire les symptômes en détail"),
  cause: z.string().min(3, "Veuillez fournir une cause probable"),
});

interface FaultReportDialogProps {
  lineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaultReportDialog({ lineId, open, onOpenChange }: FaultReportDialogProps) {
  const { declareFault } = useApp();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: "",
      cause: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (lineId) {
      declareFault(lineId, values.symptoms, values.cause);
      toast({
        title: "Panne signalée",
        description: "L'équipe de maintenance a été notifiée.",
        variant: "destructive"
      });
      onOpenChange(false);
      form.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Signaler une panne de ligne</DialogTitle>
          <DialogDescription>
            Décrivez le problème et la cause probable pour alerter la maintenance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symptômes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Pas de tonalité, bruit blanc..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cause probable</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dommages météorologiques, câble coupé..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive">Soumettre le rapport</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
