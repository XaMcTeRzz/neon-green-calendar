import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { BotIcon, CheckIcon, SaveIcon, CalendarIcon, MailIcon, BellIcon, Moon, Sun, BellRing, Languages, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SettingsFormValues {
  telegramUsername: string;
  telegramBotEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  googleCalendarEnabled: boolean;
  googleCalendarId: string;
  reminderEnabled: boolean;
  defaultReminderTime: string;
  welcomeMessage: string;
}

export function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("uk");
  
  // Initialize form with values from localStorage
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      telegramUsername: "",
      telegramBotEnabled: false,
      emailEnabled: false,
      emailAddress: "",
      googleCalendarEnabled: false,
      googleCalendarId: "",
      reminderEnabled: false,
      defaultReminderTime: "09:00",
      welcomeMessage: "Привіт! Це ваш бот-помічник для задач.",
    }
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      form.reset(parsedSettings);
    }
  }, [form]);

  useEffect(() => {
    // При першому завантаженні перевіряємо збережену тему
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light" | "system") => {
    const root = window.document.documentElement;
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
    
    localStorage.setItem("theme", newTheme);
  };

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
    
    toast({
      title: "Тема змінена",
      description: `Обрано ${
        newTheme === "dark" ? "темну" : newTheme === "light" ? "світлу" : "системну"
      } тему`,
    });
  };

  const handleClearData = () => {
    const confirmed = window.confirm("Ви впевнені, що хочете видалити всі задачі? Цю дію неможливо скасувати.");
    
    if (confirmed) {
      localStorage.removeItem("tasks");
      
      toast({
        title: "Всі дані видалено",
        description: "Всі задачі були успішно видалені",
      });
      
      // Перезавантажуємо сторінку для оновлення стану
      window.location.reload();
    }
  };

  // Save settings to localStorage
  const onSubmit = (values: SettingsFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      localStorage.setItem("userSettings", JSON.stringify(values));
      setIsSaving(false);
      toast({
        title: "Налаштування збережено",
        description: "Ваші параметри були успішно збережені",
      });
    }, 800);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <h2 className="text-xl font-semibold text-primary">Налаштування</h2>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Зовнішній вигляд</CardTitle>
          <CardDescription>Змініть тему додатку</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>Тема</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleThemeChange("light")}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Світла</span>
              </Button>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                size="sm"
                onClick={() => handleThemeChange("dark")}
                className="h-8 w-8 p-0 rounded-full"
              >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Темна</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Сповіщення</CardTitle>
          <CardDescription>Налаштування сповіщень</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              <Label htmlFor="notifications">Сповіщення про задачі</Label>
            </div>
            <Switch 
              id="notifications" 
              checked={notifications} 
              onCheckedChange={setNotifications} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Мова</CardTitle>
          <CardDescription>Оберіть мову інтерфейсу</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              <span>Мова</span>
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-1"
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glass-card border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Дані</CardTitle>
          <CardDescription>Керування даними додатку</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleClearData}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Видалити всі задачі</span>
          </Button>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Telegram Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Telegram інтеграція</h3>
                <p className="text-sm text-muted-foreground">Отримуйте сповіщення через Telegram</p>
              </div>
              <FormField
                control={form.control}
                name="telegramBotEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("telegramBotEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="telegramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ваш Telegram username</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">@</span>
                          <Input placeholder="username" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Введіть ваш username без символу @
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="welcomeMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Привітальне повідомлення</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Введіть текст, який бот надішле вам після з'єднання" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Email Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Email сповіщення</h3>
                <p className="text-sm text-muted-foreground">Отримуйте нагадування на пошту</p>
              </div>
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("emailEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email адреса</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your@email.com" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Google Calendar Integration */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">Синхронізуйте задачі з Google Calendar</p>
              </div>
              <FormField
                control={form.control}
                name="googleCalendarEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("googleCalendarEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="googleCalendarId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Google Calendar</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="calendar_id@group.calendar.google.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Знайдіть ID календаря в налаштуваннях Google Calendar
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <Button variant="outline" className="w-full" type="button">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Підключити Google Calendar
                </Button>
              </div>
            )}
          </div>

          {/* Reminders */}
          <div className="glass-card p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium">Нагадування</h3>
                <p className="text-sm text-muted-foreground">Налаштування сповіщень про задачі</p>
              </div>
              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("reminderEnabled") && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="defaultReminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Час нагадування за замовчуванням</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>
                        Час, коли ви бажаєте отримувати нагадування
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <SaveIcon className="mr-2 h-4 w-4 animate-spin" />
                Зберігаємо...
              </>
            ) : (
              <>
                <SaveIcon className="mr-2 h-4 w-4" />
                Зберегти налаштування
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
