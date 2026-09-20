import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RoundPage } from '../feature/round/components/RoundPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoundPage />
  </QueryClientProvider>
)
