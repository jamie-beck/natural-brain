import expect from 'expect.js';
import BrainJSClassifier from '../lib';

describe('BrainJS classifier', function() {
  describe('classifier', function() {
    it('should classify with arrays', function() {
      const classifier = new BrainJSClassifier();
      classifier.addDocument(['fix', 'box'], 'computing');
      classifier.addDocument(['write', 'code'], 'computing');
      classifier.addDocument(['script', 'code'], 'computing');
      classifier.addDocument(['write', 'book'], 'literature');
      classifier.addDocument(['read', 'book'], 'literature');
      classifier.addDocument(['study', 'book'], 'literature');

      classifier.train();

      expect(classifier.classify(['bug', 'code'])).to.be('computing');
      expect(classifier.classify(['read', 'thing'])).to.be('literature');
    });

    it('should provide all classification scores', function() {
      const classifier = new BrainJSClassifier();
      classifier.addDocument(['fix', 'box'], 'computing');
      classifier.addDocument(['write', 'code'], 'computing');
      classifier.addDocument(['script', 'code'], 'computing');
      classifier.addDocument(['write', 'book'], 'literature');
      classifier.addDocument(['read', 'book'], 'literature');
      classifier.addDocument(['study', 'book'], 'literature');

      classifier.train();

      expect(classifier.getClassifications('i write code')[0].label).to.be('computing');
      expect(classifier.getClassifications('i write code')[1].label).to.be('literature');
    });

    it('should classify with strings', function() {
      const classifier = new BrainJSClassifier();
      classifier.addDocument('i fixed the box', 'computing');
      classifier.addDocument('i write code', 'computing');
      classifier.addDocument('nasty script code', 'computing');
      classifier.addDocument('write a book', 'literature');
      classifier.addDocument('read a book', 'literature');
      classifier.addDocument('study the books', 'literature');

      classifier.train();

      expect(classifier.classify('a bug in the code')).to.be('computing');
      expect(classifier.classify('read all the books')).to.be('literature');
    });

    it('should classify and re-classify after document-removal', function() {
      const classifier = new BrainJSClassifier();
      const classifications = {};
      let arr, item;

      // Add some good/bad docs and train
      classifier.addDocument('foo bar baz', 'good');
      classifier.addDocument('qux zooby', 'bad');
      classifier.addDocument('asdf qwer', 'bad');
      classifier.train();

      expect(classifier.classify('foo')).to.be('good');
      expect(classifier.classify('qux')).to.be('bad');

      // Remove one of the bad docs, retrain
      classifier.removeDocument('qux zooby', 'bad');
      classifier.retrain();

      // Simple `classify` will still return a single result, even if
      // ratio for each side is equal -- have to compare actual values in
      // the classifications, should be equal since qux is unclassified
      arr = classifier.getClassifications('zooby');
      for (let i = 0, ii = arr.length; i < ii; i++) {
        item = arr[i];
        classifications[item.label] = item.value;
      }
      expect(classifications.good).to.be.lessThan(classifications.bad);

      // Re-classify as good, retrain
      classifier.addDocument('qux zooby', 'good');
      classifier.retrain();

      // Should now be good, original docs should be unaffected
      expect(classifier.classify('foo')).to.be('good');
      expect(classifier.classify('qux')).to.be('good');
    });

    it('should serialize and deserialize a working classifier', function() {
      const classifier = new BrainJSClassifier();
      classifier.addDocument('i fixed the box', 'computing');
      classifier.addDocument('i write code', 'computing');
      classifier.addDocument('nasty script code', 'computing');
      classifier.addDocument('write a book', 'literature');
      classifier.addDocument('read a book', 'literature');
      classifier.addDocument('study the books', 'literature');

      const obj = JSON.stringify(classifier);
      const newClassifier = BrainJSClassifier.restore(JSON.parse(obj));

      newClassifier.addDocument('kick a ball', 'sports');
      newClassifier.addDocument('hit some balls', 'sports');
      newClassifier.addDocument('kick and punch', 'sports');

      newClassifier.train();

      expect(newClassifier.classify('a bug in the code')).to.be('computing');
      expect(newClassifier.classify('read all the books')).to.be('literature');
      expect(newClassifier.classify('kick butt')).to.be('sports');
    });

    it('should save and load a working classifier', function(done) {
      const classifier = new BrainJSClassifier();
      classifier.addDocument('i fixed the box', 'computing');
      classifier.addDocument('i write code', 'computing');
      classifier.addDocument('nasty script code', 'computing');
      classifier.addDocument('write a book', 'literature');
      classifier.addDocument('read a book', 'literature');
      classifier.addDocument('study the books', 'literature');

      classifier.train();

      classifier.save('test/brain_classifier.json', function() {
        BrainJSClassifier.load('test/brain_classifier.json', null, null,
          function(err, newClassifier){
            expect(newClassifier.classify('The box is working')).to.be('computing');

            newClassifier.addDocument('kick a ball', 'sports');
            newClassifier.addDocument('hit some balls', 'sports');
            newClassifier.addDocument('kick and punch', 'sports');

            newClassifier.retrain();

            expect(newClassifier.classify('a bug in the code')).to.be('computing');
            expect(newClassifier.classify('read all the books')).to.be('literature');
            expect(newClassifier.classify('kick butt')).to.be('sports');
            done();
          });
      });
    });
  });

  describe('remove and restore stopwords', function() {
    it('classifies all words', function() {
      BrainJSClassifier.disableStopWords();

      const classifier = new BrainJSClassifier();

      classifier.addDocument('are you there', 'first');
      classifier.addDocument('you there', 'second');
      classifier.train();

      expect(BrainJSClassifier.stopwords.words.length).to.be(0);
      expect(classifier.classify('Hey you there')).to.be('second');
      expect(classifier.classify('Hey are you there')).to.be('first');

      BrainJSClassifier.enableStopWords();
      expect(BrainJSClassifier.stopwords.words.length).not.to.be(0);
    });
  });
});
