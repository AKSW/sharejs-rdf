
describe 'rdf/json web client script', () ->

  sharejs = window.sharejs
  rdfJson = sharejs.types['rdf-json']

  beforeEach () ->
    jasmine.addMatchers {
      toBeObject: () ->
        return compare: (actual) ->
          return pass: typeof actual == 'object'
      toBeFunction: () ->
        return compare: (actual) ->
            return pass: typeof actual == 'function'
    }


  it 'is attached to share-js', () ->
    expect( rdfJson ).toBeObject()

  it 'has the necessary properties', () ->
    expect( rdfJson.Doc ).toBeFunction()
    expect( rdfJson.Operation ).toBeFunction()
    expect( rdfJson.name ).toEqual 'rdf-json'
    expect( rdfJson.create ).toBeFunction()
    expect( rdfJson.apply ).toBeFunction()
    expect( rdfJson.transform ).toBeFunction()
