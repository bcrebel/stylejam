const _ = require('lodash')
let { parse, stringify } = require('scss-parser') 
let createQueryWrapper = require('./query-ast')
let $

module.exports = class Candidates {
  constructor(ast) {
    this.ast = ast
    $ = createQueryWrapper(this.ast)
  }

  maps() {

      // Eff up some comments
      $('comment_singleline').remove()

      let firstarray = $()
        .find('value')
        .hasParents( 'parentheses' )
        .hasParents( 'declaration' )
        .map((n) => {
          if($(n).has('parentheses').length() === 0) return n
        })

      let parentMap = (arr) => {
        return arr.map((n) => { 
          return $(n)
          .closest('declaration')
          .has('property')
          .find('property')
          .first()
          .value()
        })
      }

      let mapValues = [firstarray.map((n) => {   
        return _.isUndefined(n) ? '' : n.node.type === 'stylesheet' ? '' : stringify($(n).get(0))
      })]

      let current = []
      
      let obj = _.stubObject()

      while (!_.every(firstarray, _.isEmpty)) {
        current = parentMap(firstarray)

        if ((!_.isEqual(current, _.last(mapValues))) 
          && (!_.every(current, _.isEmpty))) mapValues.push(current) 
        
        firstarray = firstarray.map((n) => {
          return _.isUndefined(n) ? undefined : n.parent
        })
      }

      _.reverse(mapValues)
        
      let count = 0
      
      for (let value of mapValues[0]) {
        current = mapValues.reduce((acc, curr) => {
          if(!_.isUndefined(curr[count])) acc.push(curr[count].trim())
          return acc
        }, [])

        count++

        current = _.compact(current)
        
        current.unshift(current.splice(0, current.length - 1).join('-stylejam-'))
        
        if (current[0] != '') obj['#' + current[0]] = current[1]
      }

      return obj
  }

  borders() {

    let borderProps = ['dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']
    
    let borderQuery = (prop) => {
      return $((n) => n.node.value === prop).closest('declaration')
    }

    let obj = _.stubObject()

    for (let prop of borderProps) {

      let variables = borderQuery(prop).closest('declaration').find('variable').hasParent('property').map((n) => {
        return $(n).value()
      })

      let values = borderQuery(prop).closest('declaration').has('variable').find('value').map((n) => {
        return stringify($(n).get(0))
      })

      if(variables.length > 0) {
        variables.forEach((val, idx) => {
          obj['#' + val] = values[idx]
        })
      }

      variables = []
      values = []
    }

   return obj
  }

  colors() {
    let obj = Object.create(null)

    let colors = $('stylesheet')
      .children('declaration')
      .children('property')
      .has('variable').filter((n) => {
        return $(n).closest('declaration').has('parentheses').length() === 0
      }).closest('declaration').each((n) => {
      if(!_.isUndefined(n)) { 
        obj['#' + $(n).find('variable').eq(0).value()] = stringify($(n).children('value').get(0)).trim()
      }
    })

    return obj
  }
}

