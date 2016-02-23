var expect = require('expect.js')
var subject = require('../src/test')

describe('something',function(){
    it('should blabla', function(){
        expect(subject(5)).to.eql(7)
    })
})