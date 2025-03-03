import { template } from '../src/client/template.js'
import { suite, test } from 'node:test'
import assert from 'node:assert'

suite('template plugin', () => {
  suite('expand', () => {
    test('can escape html markup characters', () => {
      const result = template.expand('try < & >')
      assert.equal(result, 'try &lt; &amp; &gt;')
    })
  })
})
