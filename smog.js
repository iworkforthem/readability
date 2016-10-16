var request = require('request');
var async = require('async');
var _ = require('lodash');

var paragraph = '';
var firstWord = '';
var synonyms = [];
var statements = [];

function getSentenceCount(input) {
  return input.trim().match(/[^\r\n.!?]+(:?(:?\r\n|[\r\n]|[.!?])+|$)/gi).length;
}

function smog(input) {
  const nSent = getSentenceCount(input);
  const nComp = getComplexWords(input);
  return 1.0430 * Math.sqrt(nComp * (30 / nSent) + 3.1291);
}

function getSyllableCount(input) {
  return input.trim().split(' ').reduce((a, b) => {
    return a + (b.length <= 3 ? 1 : b.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      .replace(/^y/, '').match(/[aeiouy]{1,2}/g).length);
  }, 0);
}

function getComplexWords(input) {
  return input.trim().replace(/[^\w\s]/ig, '').split(' ').reduce((a, b) => {
    return a + (getSyllableCount(b) >= 3 ? 1 : 0);
  }, 0);
}

async.series([
    function(callback) {
      // generate random text
      request('http://randomtext.me/api/gibberish/p-1/5-13', function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var res = JSON.parse(body);
          paragraph = res.text_out
          paragraph = paragraph.replace("<p>", "");
          paragraph = paragraph.replace("</p>\r", "");
          console.log(paragraph)
          callback();
        }
      })
    },
    function(callback) {
      // get first word
      firstWord = paragraph.substr(0, paragraph.indexOf(" "));
      console.log(firstWord)
      callback();
    },
    function(callback) {
      // get thesaurus from first word
      var URL = "http://words.bighugelabs.com/api/2/503c4b37f06032b088a09dd9a7878ebd/" + firstWord + "/json"
      request(URL, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var res = JSON.parse(body);
          //console.log(res)
          if (res.adverb != null) {
            synonyms = res.adverb.syn;
          } else if (res.noun != null) {
            synonyms = res.noun.syn;
          } else if (res.adjective != null) {
            synonyms = res.adjective.syn;
          }
          //console.log(synonyms)
          callback();
        }
      })
    },
    function(callback) {
      // prepare statements from thesaurus list
      if (synonyms.length > 0) {
        for (var c = 0; c < synonyms.length; c++) {
          var statement = _.capitalize(synonyms[c]) + paragraph.substr(paragraph.indexOf(" "), paragraph.length);
          //console.log(statement)
          statements.push(statement)
        }
      } else {
        console.log('Thesaurus API did not recognize the firstWord. Try again.')
      }
      callback();
    },
    function(callback) {
      // get smog grade
      for (var c = 0; c < statements.length; c++) {
        console.log(statements[c] + ' SMOG: ' + smog(statements[c]))
      }
      callback();
    }
  ],
  // optional callback
  function(err, results) {
    // results - do some great stuff with the results & score!
    console.log();
  });

console.log();
