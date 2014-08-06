
describe 'rdf/json web client script', ->

  sharejs = window.sharejs
  rdfJson = sharejs.types['rdf-json']
  hybridOT = sharejs.types['turtle-rdf-json']

  beforeEach () ->
    jasmine.addMatchers {
      toBeObject: () ->
        return compare: (actual) ->
          return pass: typeof actual == 'object'
      toBeFunction: () ->
        return compare: (actual) ->
            return pass: typeof actual == 'function'
    }

  describe 'rdf/json type', ->

    it 'is attached to share-js', ->
      expect( rdfJson ).toBeObject()

    it 'has the necessary properties', ->
      expect( rdfJson.Doc ).toBeFunction()
      expect( rdfJson.Operation ).toBeFunction()
      expect( rdfJson.name ).toEqual 'rdf-json'
      expect( rdfJson.apply ).toBeFunction()
      expect( rdfJson.compose ).toBeFunction()
      expect( rdfJson.create ).toBeFunction()
      expect( rdfJson.transform ).toBeFunction()

  describe 'hybrid type', ->

    it 'is attached to share-js', ->
      expect( hybridOT ).toBeObject()

    it 'has the necessary properties', ->
      expect( hybridOT.doc ).toBeFunction()
      expect( hybridOT.op ).toBeFunction()
      expect( hybridOT.name ).toEqual 'turtle-rdf-json'
      expect( hybridOT.apply ).toBeFunction()
      expect( hybridOT.compose ).toBeFunction()
      expect( hybridOT.create ).toBeFunction()
      expect( hybridOT.transform ).toBeFunction()
