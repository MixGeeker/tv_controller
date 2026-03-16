import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useBreakpoint(query = '(max-width: 767px)') {
  const isMobile = ref(false)

  let mql: MediaQueryList | undefined

  const update = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    isMobile.value = mql.matches
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', update)
  })

  return { isMobile }
}
