import router from '@/router'

export default store => {
  let isLoggedIn = () => store.getters['auth/isLoggedIn']
  let hasActiveGroup = () => !!store.getters['groups/activeGroup']
  let getUserGroupId = () => isLoggedIn() && store.getters['auth/user'].currentGroup
  let getBreadcrumbNames = () => store.getters['breadcrumbs/allNames']
  let getInviteToken = () => store.getters['route/query'].invite

  router.beforeEach((to, from, next) => {
    window.scrollTo(0, 0)

    // handle invite parameter
    if (getInviteToken()) {
      if (isLoggedIn()) {
        store.dispatch('invitations/accept', getInviteToken())
        next({ name: 'root' })
      }
      else {
        store.dispatch('auth/setAcceptInviteAfterLogin', getInviteToken())
        next({ name: 'signup' })
      }
    }

    // redirect homescreen correctly
    else if (to.name === 'root') {
      if (getUserGroupId()) {
        next({ name: 'group', params: { groupId: getUserGroupId() } })
      }
      else {
        next({ name: 'groupsGallery' })
      }
    }

    // check meta.requireLoggedIn
    else if (to.matched.some(m => m.meta.requireLoggedIn) && !isLoggedIn()) {
      let { name, params } = to
      store.dispatch('auth/setRedirectTo', { name, params })
      next({ name: 'login' })
    }

    // check meta.requireLoggedOut
    else if (to.matched.some(m => m.meta.requireLoggedOut) && isLoggedIn()) {
      next({ name: 'root' })
    }

    next()
  })

  router.afterEach((to, from) => {
    // save Breadcrumbs to store
    if (!(to.meta) || !(to.meta.breadcrumbs)) {
      store.dispatch('breadcrumbs/setAll', [{name: 'not defined'}])
    }
    store.dispatch('breadcrumbs/setAll', to.meta.breadcrumbs || [])

    // save active group/store/user
    if (to.params.groupId) {
      store.dispatch('groups/selectGroup', parseInt(to.params.groupId, 10))
    }
    if (to.params.groupInfoId) {
      store.dispatch('groups/selectGroupInfo', parseInt(to.params.groupInfoId, 10))
    }
    if (to.params.storeId) {
      store.dispatch('stores/selectStore', parseInt(to.params.storeId, 10))
    }
    if (to.params.userId) {
      store.dispatch('users/selectUser', parseInt(to.params.userId, 10))
    }

    /* If:
        - the group is not mentioned in the URL
        - we do not have an active group
        - the user has a currentGroup
      Then:
        - set the users current group to be the active one
     */
    if (!to.params.groupId && !hasActiveGroup() && isLoggedIn()) {
      let groupId = getUserGroupId()
      if (groupId) store.dispatch('groups/selectGroup', groupId)
    }
  })

  store.watch(getBreadcrumbNames, breadcrumbs => {
    let names = getBreadcrumbNames().slice().reverse()
    names.push('Karrot')
    document.title = names.join(' | ')
  })
}
