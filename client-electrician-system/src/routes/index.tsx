import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  throw redirect({ to: '/dashboard' });
}
