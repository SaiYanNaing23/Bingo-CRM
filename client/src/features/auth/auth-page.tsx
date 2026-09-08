import { useEffect } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from './auth-context'
import { safeReturnPath } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormError, Pending } from '@/components/shared/states'
import { BrandLogo } from '@/components/shared/brand-logo'
export default function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = safeReturnPath(location.state?.from)
  const schema = z.object({
    fullName: register
      ? z.string().trim().min(2, 'Enter your full name (at least 2 characters).')
      : z.string(),
    email: z.email('Enter a valid email address.'),
    password: z
      .string()
      .min(register ? 8 : 1, register ? 'Use at least 8 characters.' : 'Enter your password.')
      .max(128),
  })
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })
  useEffect(() => {
    document.title = `${register ? 'Create account' : 'Sign in'} · BINGO CRM`
  }, [register])

  if (auth.user) return <Navigate to={from} replace />
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between border-r bg-muted p-14 lg:flex">
        <Link to="/login" className="flex w-fit items-center gap-4 text-xl font-semibold">
          <BrandLogo className="size-16 rounded-lg" />
          <span>
            BINGO CRM
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Career workspace
            </span>
          </span>
        </Link>
        <div className="max-w-md">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.18em] text-link">
            Make space for what’s next
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Your next chapter,
            <br />a little more organized.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Keep your opportunities, conversations, and daily steps together in one considered
            workspace.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'A clear view of your applications',
              'Thoughtful follow-ups with your contacts',
              'Small daily steps that add up',
            ].map((text) => (
              <p className="flex items-center gap-3" key={text}>
                <Check className="size-4 text-link" />
                {text}
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">A quieter way to move your career forward.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/login"
            className="mb-10 flex w-fit items-center gap-3 text-lg font-semibold lg:hidden"
          >
            <BrandLogo className="size-14 rounded-lg" />
            BINGO CRM
          </Link>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your career workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            {register ? 'Start your next chapter' : 'Welcome back'}
          </h2>
          <p className="mb-8 mt-3 leading-relaxed text-muted-foreground">
            {register
              ? 'Create an account to bring your career plans together.'
              : 'Sign in and pick up where you left off.'}
          </p>
          {auth.message && (
            <p role="status" className="mb-4 rounded-md bg-accent p-3 text-sm">
              {auth.message}
            </p>
          )}
          <form
            noValidate
            className="space-y-5"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await auth.login(
                  register ? values : { email: values.email, password: values.password },
                  register,
                )
                navigate(from, { replace: true })
              } catch (error) {
                form.setError('root', { message: (error as Error).message })
              }
            })}
          >
            {(register
              ? (['fullName', 'email', 'password'] as const)
              : (['email', 'password'] as const)
            ).map((key) => (
              <div key={key}>
                <Label className="mb-2 block" htmlFor={key}>
                  {key === 'fullName'
                    ? 'Full name'
                    : key === 'email'
                      ? 'Email address'
                      : 'Password'}
                </Label>
                <Input
                  id={key}
                  type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                  autoComplete={
                    key === 'password'
                      ? register
                        ? 'new-password'
                        : 'current-password'
                      : key === 'fullName'
                        ? 'name'
                        : 'email'
                  }
                  aria-invalid={!!form.formState.errors[key]}
                  aria-describedby={`${key}-error`}
                  {...form.register(key)}
                />
                <p id={`${key}-error`} className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors[key]?.message}
                </p>
              </div>
            ))}
            <FormError error={form.formState.errors.root?.message} />
            <Button className="w-full" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <Pending>Signing in…</Pending>
              ) : (
                <>
                  {register ? 'Create account' : 'Sign in'}
                  <ArrowRight className="ml-auto size-4" />
                </>
              )}
            </Button>
          </form>
          <p className="mt-7 text-center text-sm text-muted-foreground">
            {register ? 'Already have an account?' : 'New to BINGO CRM?'}{' '}
            <Link
              to={register ? '/login' : '/register'}
              state={{ from }}
              className="font-medium text-link hover:underline"
            >
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <p className="mt-12 text-center text-xs text-muted-foreground">
            Your workspace is private to your account.
          </p>
        </div>
      </section>
    </main>
  )
}
