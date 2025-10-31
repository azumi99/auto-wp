"use client";

import * as React from "react";
import {
  IconUser,
  IconMail,
  IconLock,
  IconCamera,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import MainLayout from "@/app/main";
import { createClient, uploadAvatar, removeAvatar } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    avatar: "",
  });
  const router = useRouter();
  console.log(formData)

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setFormData({
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url || "",
          });
        }
      } catch {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const updates: any = {};
      if (formData.name !== (user.user_metadata?.full_name || user.email?.split("@")[0])) {
        updates.full_name = formData.name;
      }
      if (formData.avatar !== user.user_metadata?.avatar_url) {
        updates.avatar_url = formData.avatar;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser({ data: updates });
        if (error) throw error;
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      localStorage.clear();
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to logout");
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex items-center gap-4">
          <a href="/dashboard">
            <Button variant="outline" size="icon">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </a>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.avatar} alt={formData.name} />
                      <AvatarFallback className="text-2xl">
                        {formData.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full bg-primary p-2 shadow-md"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <IconCamera className="h-4 w-4" />
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          try {
                            setLoading(true);
                            const supabase = createClient();
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) throw new Error("User not authenticated");
                            const publicUrl = await uploadAvatar(file, user.id);
                            setFormData({ ...formData, avatar: publicUrl });
                            const { error } = await supabase.auth.updateUser({
                              data: { avatar_url: publicUrl },
                            });
                            if (error) throw error;
                            toast.success("Profile picture updated");
                          } catch (error: any) {
                            toast.error(error?.message || "Failed to upload avatar");
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    Change Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const supabase = createClient();
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) throw new Error("User not authenticated");
                        await removeAvatar(user.id);
                        setFormData({ ...formData, avatar: "" });
                        const { error } = await supabase.auth.updateUser({
                          data: { avatar_url: null },
                        });
                        if (error) throw error;
                        toast.success("Profile picture removed");
                      } catch (error: any) {
                        toast.error(error?.message || "Failed to remove avatar");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSave}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <IconUser className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Your full name"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        className="pl-10"
                        value={formData.email}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value="••••••••"
                        readOnly
                      />
                    </div>
                    <Button variant="outline" size="sm" className="w-fit">
                      Change Password
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
