import { useState } from "react";
import { Header } from "@/components/Header";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { saveComplaint } from "@/lib/complaints";

const formSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select a priority"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100, "Subject must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
});

export default function SubmitComplaint() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      priority: "",
      subject: "",
      description: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      setAttachmentFile(file);
    } else {
      setAttachmentName("");
      setAttachmentFile(null);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Save complaint to backend
      const complaint = await saveComplaint({
        subject: values.subject,
        category: values.category,
        priority: values.priority,
        description: values.description,
        attachment: attachmentName || undefined,
      }, attachmentFile || undefined);

      toast({
        title: "Complaint Submitted",
        description: `Your complaint has been successfully submitted. You will receive updates via email.`,
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit complaint",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="COMPLAINT MANAGEMENT SYSTEM" hideDashboardButton />
      
      <main className="mx-auto max-w-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Submit Complaint</h2>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select one" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Brief description of the issue"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of your complaint"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="attachment" className="text-sm font-medium">Attachment (Optional)</Label>
                <div className="mt-2">
                  <Input 
                    id="attachment"
                    type="file"
                    className="cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {attachmentName || "No file chosen"}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <ChatBot />
    </div>
  );
}
