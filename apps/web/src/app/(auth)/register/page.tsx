import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@carpool/ui';

export const metadata = { title: 'Sign Up' };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Register with your company code and profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* TODO: RegisterForm → authService.register */}
        <p className="text-sm text-muted-foreground">Registration form placeholder.</p>
      </CardContent>
    </Card>
  );
}
