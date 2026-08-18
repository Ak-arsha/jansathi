import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { UserCheck, Shield, Landmark } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl || "https://auth.kimi.com"}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID || "demo-app");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const devLoginMutation = trpc.auth.devLogin.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white mb-3 shadow-md">
            <Landmark className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">JanSathi Portal Sign In</CardTitle>
          <CardDescription>Access AI public service tools & scheme tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-5 shadow-md shadow-indigo-500/20"
            size="lg"
            disabled={devLoginMutation.isPending}
            onClick={() => {
              devLoginMutation.mutate();
            }}
          >
            <UserCheck className="w-5 h-5 mr-2" />
            {devLoginMutation.isPending ? "Signing in..." : "Quick Sign In (Local Dev Account)"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or OAuth</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full text-slate-700 dark:text-slate-300"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            <Shield className="w-4 h-4 mr-2" /> Sign in with Kimi OAuth
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
