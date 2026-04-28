import re
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin


class LinguisticFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Production linguistic feature extractor.
    Handles both sensational AND politely-written fake news.
    """

    SENSATIONAL = [
        'breaking', 'shocking', 'bombshell', 'exposed', 'urgent', 'secret',
        'conspiracy', 'censored', 'banned', 'whistleblower', 'elite', 'hidden',
        'truth', 'wake up', 'sheeple', 'suppressed', 'silenced', 'cover-up',
        'they dont want', 'share before deleted', 'forward this', 'overnight',
        'doubles', 'instantly', 'miraculous', 'cure', 'unnamed', 'anonymous source',
        'mainstream media refuses', 'big pharma', 'deep state', 'share before',
        'before it gets deleted', 'before they delete', 'wake up people',
        'they are hiding', 'what they dont', 'you wont believe',
    ]

    POLITE_FAKE = [
        'unverified sources',
        'unverified reports',
        'according to unverified',
        'no scientific studies',
        'no peer-reviewed',
        'not been peer-reviewed',
        'no clinical trials',
        'no published studies',
        'no evidence',
        'no documented evidence',
        'no scientific evidence',
        'no scientific basis',
        'no scientific verification',
        'experts have not confirmed',
        'experts, however, have not',
        'medical experts have not',
        'doctors have not confirmed',
        'scientists have not confirmed',
        'health authorities have not',
        'medical community has not',
        'not confirmed by',
        'authorities have not confirmed',
        'rapidly gaining popularity on social media',
        'spreading on social media',
        'going viral on social media',
        'gone viral',
        'circulating on social media',
        'circulating online',
        'being claimed to cure',
        'claimed to cure',
        'reportedly stopped',
        'reportedly cured',
        'allegedly helped',
        'allegedly cured',
        'allegedly discovered',
        'reportedly helps',
        'reportedly reversed',
        'unnamed researcher',
        'unnamed scientist',
        'unnamed doctor',
        'no verifiable credentials',
        'informal trial',
        'informal study',
        'no medical verification',
        'suppressed to protect',
        'spreading rapidly',
        'spreading widely',
        'viral on social media',
        'thousands have reportedly',
        'hundreds have reportedly',
        'patients have reportedly stopped',
        'reportedly stopped their medication',
        'stopped prescribed',
        'without medication',
        'without any medical',
        'permanently cure',
        'permanently reverse',
        'completely cure',
        'cure all',
        'cures all',
        'eliminate all diseases',
        'reverse all',
        'within 24 hours',
        'within days',
        'within weeks without',
        'in just',
        'anonymous insiders',
        'anonymous sources',
        'anonymous source',
        'insider claims',
    ]

    CREDIBLE = [
        'according to', 'published in', 'peer-reviewed', 'study found',
        'researchers say', 'data shows', 'evidence suggests', 'confirmed by',
        'official statement', 'journal of', 'university', 'clinical trial',
        'statistically significant', 'however', 'experts note', 'authorities confirmed',
        'cited', 'analysis of', 'survey of', 'based on data', 'participants',
        'randomized controlled', 'double blind', 'systematic review',
        'published in the lancet', 'published in nature', 'published in jama',
        'published in nejm', 'new england journal', 'press release',
        'official website', 'filed with', 'commission', 'ministry',
        'government announced', 'official data', 'government data',
    ]

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []
        for text in X:
            t   = str(text)
            tl  = t.lower()
            words = tl.split()
            chars = len(t)

            excl       = t.count('!')
            ques       = t.count('?')
            caps_ratio = sum(1 for c in t if c.isupper()) / max(chars, 1)
            caps_words = sum(1 for w in t.split() if w.isupper() and len(w) > 2)

            sens_score   = sum(1 for p in self.SENSATIONAL  if p in tl)
            polite_score = sum(1 for p in self.POLITE_FAKE  if p in tl)
            cred_score   = sum(1 for p in self.CREDIBLE     if p in tl)

            avg_word_len  = np.mean([len(w) for w in words]) if words else 0
            num_sentences = max(len(re.findall(r'[.!?]+', t)), 1)
            avg_sent_len  = len(words) / num_sentences

            total_fake = sens_score + polite_score

            features.append([
                excl,
                ques,
                caps_ratio,
                caps_words,
                sens_score,
                polite_score,
                cred_score,
                avg_word_len,
                avg_sent_len,
                len(words),
                total_fake - cred_score,
                excl + caps_words * 0.5,
                cred_score / max(total_fake, 1),
                polite_score * 2,
                int('unverified'      in tl),
                int('no scientific'   in tl),
                int('social media'    in tl),
                int('not confirmed'   in tl),
                int('unnamed'         in tl or 'anonymous' in tl),
                int('reportedly'      in tl),
                int('allegedly'       in tl),
                int('going viral'     in tl or 'gone viral' in tl),
                int('spreading'       in tl),
                int('cure all'        in tl or 'cures all' in tl),
                int('permanently cure' in tl or 'completely cure' in tl),
                int('within 24 hours' in tl or 'within days' in tl),
                int('stopped their medication' in tl or 'stopped prescribed' in tl),
            ])
        return np.array(features)