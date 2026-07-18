export const metadata = { title: 'Employees' };

export default function AdminEmployeesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
      <p className="text-sm text-muted-foreground">
        Company admin: manage employee records and platform access. (spec 3)
      </p>
    </section>
  );
}
