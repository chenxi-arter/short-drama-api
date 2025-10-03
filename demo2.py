
import hashlib
import os
from urllib.parse import urljoin

import requests
from xigua_hls_r2 import HLSUploader


def run():

    watermark_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yuanse.png")
    hls_task = HLSUploader(
            bucket_name = 'test-storage',
            endpoint_url='https://f087ad6671b31b44e44b198b4858bc37.r2.cloudflarestorage.com',
            aws_access_key_id='59dfd4db1e847e15144a86505f28de2f',
            aws_secret_access_key='d47cab884b21d3cc4cc90d5a8c83ef129374725dc1ed2bf971d80fd35593a1c1',
            max_workers=50,
            watermark_path=watermark_path
        )

    url = ''
    vid = '55123'
    externalId = 'dj55' + vid
    file = hashlib.md5(externalId.encode()).hexdigest() + '.jpg'
    key = f'video/cover/{file}'
    body = requests.get(url).content
    hls_task.upload_to_r2(key=key, body=body, bucket_name='static-storage')

    return urljoin('https://static.656932.com',key)