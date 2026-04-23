export interface AppDeeplink {
  appId: 'happ' | 'v2box' | 'v2raytun' | 'streisand'
  deeplink: string
}

export interface RoutingConfig {
  id: string
  name: string
  description: string
  deeplinks: AppDeeplink[]
}

export const ROUTING_CONFIGS: RoutingConfig[] = [
  {
    id: 'rf-direct',
    name: 'РФ напрямую',
    description:
      'Трафик к российским сайтам и приложениям идёт напрямую, без VPN. YouTube и Discord - через VPN.',
    deeplinks: [
      {
        appId: 'happ',
        deeplink:
          'happ://routing/add/ewogICAgIkJsb2NrSXAiOiBbCiAgICBdLAogICAgIkJsb2NrU2l0ZXMiOiBbCiAgICBdLAogICAgIkRpcmVjdElwIjogWwogICAgICAgICJnZW9pcDpSVSIKICAgIF0sCiAgICAiRGlyZWN0U2l0ZXMiOiBbCiAgICBdLAogICAgIkRuc0hvc3RzIjogewogICAgICAgICJjbG91ZGZsYXJlLWRucy5jb20iOiAiMS4xLjEuMSIsCiAgICAgICAgImRucy5nb29nbGUiOiAiOC44LjguOCIKICAgIH0sCiAgICAiRG9tYWluU3RyYXRlZ3kiOiAiSVBJZk5vbk1hdGNoIiwKICAgICJEb21lc3RpY0ROU0RvbWFpbiI6ICJodHRwczovL2Rucy5nb29nbGUvZG5zLXF1ZXJ5IiwKICAgICJEb21lc3RpY0ROU0lQIjogIjguOC44LjgiLAogICAgIkRvbWVzdGljRE5TVHlwZSI6ICJEb0giLAogICAgIkZha2VETlMiOiAiZmFsc2UiLAogICAgIkdlb2lwdXJsIjogImh0dHBzOi8vZ2l0aHViLmNvbS9Mb3lhbHNvbGRpZXIvdjJyYXktcnVsZXMtZGF0L3JlbGVhc2VzL2xhdGVzdC9kb3dubG9hZC9nZW9pcC5kYXQiLAogICAgIkdlb3NpdGV1cmwiOiAiaHR0cHM6Ly9naXRodWIuY29tL0xveWFsc29sZGllci92MnJheS1ydWxlcy1kYXQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2dlb3NpdGUuZGF0IiwKICAgICJHbG9iYWxQcm94eSI6ICJ0cnVlIiwKICAgICJMYXN0VXBkYXRlZCI6IDE3NzUyNDgxMjgsCiAgICAiTmFtZSI6ICLQoNCkINC90LDQv9GA0Y/QvNGD0Y4iLAogICAgIlByb3h5SXAiOiBbCiAgICBdLAogICAgIlByb3h5U2l0ZXMiOiBbCiAgICBdLAogICAgIlJlbW90ZUROU0RvbWFpbiI6ICJodHRwczovL2Nsb3VkZmxhcmUtZG5zLmNvbS9kbnMtcXVlcnkiLAogICAgIlJlbW90ZUROU0lQIjogIjEuMS4xLjEiLAogICAgIlJlbW90ZUROU1R5cGUiOiAiRG9IIiwKICAgICJSb3V0ZU9yZGVyIjogImJsb2NrLWRpcmVjdC1wcm94eSIKfQo=',
      },
      {
        appId: 'v2box',
        deeplink:
          'v2box://routes?single=eyJtYXRjaE1vZGUiOiJrZXl3b3JkIiwibmFtZSI6InJvdXRlLkRBREMyOTlGLUREMEEtNDRBMi1BQjY2LUQ5NDQ2RURCQjZFNyIsInJlbWFyayI6ItCg0KQg0L3QsNC/0YDRj9C80YPRjiIsInRhZyI6ImRpcmVjdCIsInR5cGUiOiJJUCIsImlzRW5hYmxlIjp0cnVlLCJsaXN0IjpbXSwibGlzdElQIjpbImdlb2lwOlJVIl19',
      },
    ],
  },
  {
    id: 'block-ads',
    name: 'Блокировка рекламы',
    description:
      'Блокирует рекламные домены на уровне маршрутизации. Меньше рекламы в приложениях и браузере.',
    deeplinks: [
      {
        appId: 'v2box',
        deeplink:
          'v2box://routes?single=eyJ0eXBlIjoiRG9tYWluIiwicmVtYXJrIjoi0JfQsNCx0LvQvtC60LjRgNC+0LLQsNGC0Ywg0YDQtdC60LvQsNC80YMiLCJtYXRjaE1vZGUiOiJrZXl3b3JkIiwibGlzdElQIjpbXSwibmFtZSI6InJvdXRlLjE4NDAxMzFELTUxQTktNDVFOS1CRUFGLUVFODAzRDZDNDk0MSIsInRhZyI6ImJsb2NrIiwiaXNFbmFibGUiOnRydWUsImxpc3QiOlsiZ2Vvc2l0ZTpjYXRlZ29yeS1hZHMtYWxsIl19',
      },
    ],
  },

  {
    id: 'rf-direct-max-block',
    name: 'РФ напрямую, Max блокирован',
    description:
      'Трафик к российским сайтам и приложениям идёт напрямую, без VPN. Max заблокирован.',
    deeplinks: [
      {
        appId: 'happ',
        deeplink:
          'happ://routing/add/ewogICAgIkJsb2NrSXAiOiBbCiAgICBdLAogICAgIkJsb2NrU2l0ZXMiOiBbCiAgICAgICAgIm1heC5ydSIsCiAgICAgICAgIndlYi5tYXgucnUiLAogICAgICAgICJzdC5tYXgucnUiCiAgICBdLAogICAgIkRpcmVjdElwIjogWwogICAgICAgICIxMC4wLjAuMC84IiwKICAgICAgICAiMTcyLjE2LjAuMC8xMiIsCiAgICAgICAgIjE5Mi4xNjguMC4wLzE2IiwKICAgICAgICAiMTY5LjI1NC4wLjAvMTYiLAogICAgICAgICIyMjQuMC4wLjAvNCIsCiAgICAgICAgIjI1NS4yNTUuMjU1LjI1NSIsCiAgICAgICAgImdlb2lwOlJVIgogICAgXSwKICAgICJEaXJlY3RTaXRlcyI6IFsKICAgIF0sCiAgICAiRG5zSG9zdHMiOiB7CiAgICAgICAgImNsb3VkZmxhcmUtZG5zLmNvbSI6ICIxLjEuMS4xIiwKICAgICAgICAiZG5zLmdvb2dsZSI6ICI4LjguOC44IgogICAgfSwKICAgICJEb21haW5TdHJhdGVneSI6ICJJUElmTm9uTWF0Y2giLAogICAgIkRvbWVzdGljRE5TRG9tYWluIjogImh0dHBzOi8vZG5zLmdvb2dsZS9kbnMtcXVlcnkiLAogICAgIkRvbWVzdGljRE5TSVAiOiAiOC44LjguOCIsCiAgICAiRG9tZXN0aWNETlNUeXBlIjogIkRvSCIsCiAgICAiRmFrZUROUyI6ICJmYWxzZSIsCiAgICAiR2VvaXB1cmwiOiAiaHR0cHM6Ly9naXRodWIuY29tL0xveWFsc29sZGllci92MnJheS1ydWxlcy1kYXQvcmVsZWFzZXMvbGF0ZXN0L2Rvd25sb2FkL2dlb2lwLmRhdCIsCiAgICAiR2Vvc2l0ZXVybCI6ICJodHRwczovL2dpdGh1Yi5jb20vTG95YWxzb2xkaWVyL3YycmF5LXJ1bGVzLWRhdC9yZWxlYXNlcy9sYXRlc3QvZG93bmxvYWQvZ2Vvc2l0ZS5kYXQiLAogICAgIkdsb2JhbFByb3h5IjogInRydWUiLAogICAgIkxhc3RVcGRhdGVkIjogMTc3NTkwMjI2OSwKICAgICJOYW1lIjogItCg0KQg0L3QsNC/0YDRj9C80YPRjiAo0LHQtdC3IE1heCkiLAogICAgIlByb3h5SXAiOiBbCiAgICBdLAogICAgIlByb3h5U2l0ZXMiOiBbCiAgICAgICAgImFwaTIuY3Vyc29yLnNoIiwKICAgICAgICAiYXBpMy5jdXJzb3Iuc2giLAogICAgICAgICJhcGk0LmN1cnNvci5zaCIsCiAgICAgICAgIiouYXBpNS5jdXJzb3Iuc2giLAogICAgICAgICJyZXBvNDIuY3Vyc29yLnNoIiwKICAgICAgICAiKi5hdXRoZW50aWNhdGlvbi5jdXJzb3Iuc2giLAogICAgICAgICJhdXRoZW50aWNhdG9yLmN1cnNvci5zaCIsCiAgICAgICAgIm1hcmtldHBsYWNlLmN1cnNvcmFwaS5jb20iLAogICAgICAgICJjdXJzb3ItY2RuLmNvbSIsCiAgICAgICAgImRvd25sb2Fkcy5jdXJzb3IuY29tIgogICAgXSwKICAgICJSZW1vdGVETlNEb21haW4iOiAiaHR0cHM6Ly9jbG91ZGZsYXJlLWRucy5jb20vZG5zLXF1ZXJ5IiwKICAgICJSZW1vdGVETlNJUCI6ICIxLjEuMS4xIiwKICAgICJSZW1vdGVETlNUeXBlIjogIkRvSCIsCiAgICAiUm91dGVPcmRlciI6ICJibG9jay1kaXJlY3QtcHJveHkiCn0K',
      },
    ],
  },
]

export const APP_META: Record<
  string,
  { name: string; logo: string }
> = {
  happ: { name: 'Happ', logo: '/assets/happ-plus-logo.png' },
  v2box: { name: 'V2Box', logo: '/assets/v2box-logo.png' },
  v2raytun: { name: 'V2RayTun', logo: '/assets/v2raytun-logo.png' },
  streisand: { name: 'Streisand', logo: '/assets/streisand-logo.png' },
}
