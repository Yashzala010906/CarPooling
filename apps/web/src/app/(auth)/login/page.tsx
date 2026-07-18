import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@carpool/ui';

export const metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Login</CardTitle>
        <CardDescription>Sign in with your company email.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* TODO: LoginForm → authService.login → useAuthStore */}
        <p className="text-sm text-muted-foreground">Login form placeholder.</p>
      </CardContent>
    </Card>
  );
}
