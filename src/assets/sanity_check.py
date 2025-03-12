# %%
import numpy as np
import pandas as pd
import onnxruntime as ort

# %%
df = pd.read_json("data_cleaned_deduped.json", lines=True)
embeddings = np.load("embeddings_deduped.npy")

# %%
len(df), len(embeddings)

# %%
# get the index of the row with the title 
title = "He Who Fights With Monsters"  
row = df[df['title'] == title].index[0]

# %%
row

# %%
reference_embedding = embeddings[row]
indexes = np.argsort(np.dot(reference_embedding.astype(np.int32), embeddings.astype(np.int32).T))[::-1]

# %%
indexes

# %%
df.iloc[indexes]

# %%
session = ort.InferenceSession("vector_search.onnx")

# %%
onnx_indexes = session.run(None, {"query": reference_embedding.reshape(1, -1), "corpus": embeddings, "top_k": [10]})
# %%
onnx_indexes[1], onnx_indexes[0]
# %%
df.iloc[onnx_indexes[1][0]]
# %%
df.iloc[indexes]
# %%


reference_embedding
# %%
embeddings.dtype
# %%
df
# %%
df["embeddingsIndex"] = df.index
df
# %%
df.to_json("data_cleaned_deduped_index.json", lines=True, orient="records")
# %%
