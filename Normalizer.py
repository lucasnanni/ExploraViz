import re
from nltk.corpus import wordnet as wn
from nltk.stem.wordnet import WordNetLemmatizer

# Load all WordNet synsets.
wn.all_synsets()

class SemanticNormalizer:
	
	__stopWords = set(open("stop_words.txt").read().splitlines())
	__wnl = WordNetLemmatizer()
	
	def __init__(self):
		self.index = {}
	
	def __lemmatized(self, match):
		word = match.group(0).lower()
		if word in self.__stopWords:
			return word
		if self.index.has_key(word):
			return self.index[word]
		else:
			synsets = wn.synsets(self.__wnl.lemmatize(word))
			if synsets:
				lemma = synsets[0].name.split(".")[0]
				if lemma in self.__stopWords:
					return word
				self.index[word] = lemma
				return lemma
			else:
				return word
	
	def normalize(self, string):
		return re.sub("[A-Za-z]{2,}", self.__lemmatized, string)