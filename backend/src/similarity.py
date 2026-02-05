import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def similarity_score(e1, e2):
    return cosine_similarity(
        np.array(e1).reshape(1, -1),
        np.array(e2).reshape(1, -1)
    )[0][0]
