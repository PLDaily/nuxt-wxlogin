export const state = () => ({
  accessToken: null
})

export const mutations = {
  SETACCESSTOKEN (state, accessToken) {
    state.accessToken = accessToken
  }
}

export const actions = {
  nuxtServerInit ({commit}, {req, res, redirect}) {
    if (req.session && req.session.accessToken) {
      commit('SETACCESSTOKEN', req.session.accessToken)
    }
  }
}
