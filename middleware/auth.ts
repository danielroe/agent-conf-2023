export default defineEventHandler(async event => {
  event.context.user = { id: 1 }
})
