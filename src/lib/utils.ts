import _ from 'lodash'

const regex = /\/(\w+)(\?.*)?$/
export const getDatabase = (connectUri: string) => {
  const match = regex.exec(connectUri)
  if (match) {
    return match[1]
  }
}
