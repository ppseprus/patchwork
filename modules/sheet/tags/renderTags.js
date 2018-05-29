var { h, map, computed, Value, lookup } = require('mutant')
var nest = require('depnest')
var catchLinks = require('../../../lib/catch-links')

exports.needs = nest({
  'about.obs.name': 'first',
  'app.navigate': 'first',
  'intl.sync.i18n': 'first',
  'keys.sync.id': 'first',
})

exports.gives = nest('sheet.tags.renderTags')

exports.create = function (api) {
  const i18n = api.intl.sync.i18n
  return nest('sheet.tags.renderTags', function (ids, select) {
    var currentFilter = Value()
    var tagLookup = lookup(ids, (id) => {
      return [id, api.about.obs.name(id)]
    })
    var filteredIds = computed([ids, tagLookup, currentFilter], (ids, tagLookup, filter) => {
      if (filter) {
        var result = []
        for (var k in tagLookup) {
          if (
            (tagLookup[k] && tagLookup[k].toLowerCase().includes(filter.toLowerCase())) ||
            k === filter
          ) {
            result.push(k)
          }
        }
        return result
      } else {
        return ids
      }
    })
    var content = h('TagSheet', [
      h('h2', [
        i18n('Applied Tags'),
        h('input', {
          type: 'search',
          placeholder: 'filter tags',
          'ev-input': ev => currentFilter.set(ev.target.value),
          hooks: [ FocusHook() ],
        })
      ]),
      renderTagList(filteredIds, select)
    ])

    catchLinks(content, (href, external, anchor) => {
      if (!external) {
        api.app.navigate(href, anchor)
        close()
      }
    })

    return content
  })

  function renderTagList (tags, select) {
    var yourId = api.keys.sync.id()
    return [
      h('TagList', [
        map(tags, (id) => {
          return h('a.tag', {
            href: `/tags/${id}`,
            title: id
          }, [
            h('div.main', [
              h('div.name', [ api.about.obs.name(id) ])
            ]),
            h('div.buttons', [
              h('a.ToggleButton', { 'ev-click': () => select(id) }, i18n('View Taggers'))
            ])
          ])
        }, { idle: true, maxTime: 2 })
      ])
    ]
  }
}

function FocusHook () {
  return function (element) {
    setTimeout(() => {
      element.focus()
      element.select()
    }, 5)
  }
}