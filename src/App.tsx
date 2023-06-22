import React, { useState, useEffect } from 'react';
import './App.css';
import { apiMidia, apiUsuario } from './api';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [getFile, setGetFile] = useState<File | null>(null);
    const [url, setUrl] = useState<string>('');
    const [image, setImage] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [urlArray, setUrlArray] = useState<string[]>([]);
    const [userValido, setUserValido] = useState<boolean>(false);

    useEffect(() => {
        const storedUrls = localStorage.getItem("urls");
        if (storedUrls) {
            setUrlArray(JSON.parse(storedUrls));
        } else {
            setUrlArray([]);
        }
    }, []);

    useEffect(() => {
        const storedCodigo = localStorage.getItem("codigo");
        console.log(storedCodigo)
        if (storedCodigo) {
            validateUser(storedCodigo);
        } else {
            setUserValido(false);
        }
    }, []);


    useEffect(() => {
        if (code) {
            apiUsuario.get('/validarUsuario/' + code).then((response) => {
                setUrlArray(response.data);
            });
        }
    }, [code]);

    // Function to add a new URL to the array
    const addUrl = (newUrl: string) => {
        var updatedArray: string[] = [];

        if (urlArray.length > 0) {
            updatedArray = [...urlArray, newUrl];
            setUrlArray(updatedArray);
            localStorage.setItem("urls", JSON.stringify(updatedArray));
        } else {
            updatedArray = [newUrl];
            setUrlArray(updatedArray);
            localStorage.setItem("urls", JSON.stringify(updatedArray));
        }
    };

    async function getAllUrls() {
        if (code) {
            await apiMidia.get("buscaArquivosUsuario/" + code).then((response) => {
                if (response.data.length > 0) {
                    response.data.map((object: any) => {
                        setUrlArray([...urlArray, object.url]);
                    })
                    console.log(response.data.map((object: any) => object.url))
                } else {
                    console.log('Nenhum arquivo encontrado')
                }
            });
        }
    }


    // Function to update an existing URL in the array
    const updateUrl = (updatedUrl: string) => {
        const updatedArray = urlArray.map(url => url === updatedUrl ? updatedUrl : url);
        console.log(updatedArray)
        setUrlArray(updatedArray);
        localStorage.setItem("urls", JSON.stringify(updatedArray));
    };


    const fileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    }

    const fileUploadHandler = async () => {
        const formData = new FormData();
        if (selectedFile) {
            formData.append('file', selectedFile, selectedFile.name);
            try {
                await apiMidia.post('salvarArquivo/' + code, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then((response) => {
                    console.log(response.data);
                    addUrl(response.data.url);
                    setUrl(response.data.url);
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    const fileDownloadHandler = async () => {
        try {
            await apiMidia.get('verArquivo/' + url, {
                responseType: 'arraybuffer' // informe ao axios que estamos esperando dados binários
            }).then((response) => {

                // Criar um Blob a partir dos dados binários
                const blob = new Blob([response.data], { type: 'image/png' });

                // Criar um URL Object a partir do Blob
                const imageUrl = URL.createObjectURL(blob);

                // Atualizar o estado com a URL da imagem
                setImage(imageUrl);
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSetCodigo() {
        localStorage.setItem('codigo', code);
        try {
            await apiUsuario.post('salvarUsuario/' + code).then((response) => {
                console.log(response.data);
            })
        } catch (error) {
            console.error(error);
        }
    }


    async function validateUser(localCode?: string) {
        if (!localCode) {
            await apiUsuario.get('/validarUsuario/' + code).then((response) => {
                console.log(response.data);
                setUserValido(true);
                getAllUrls();
            }).catch((error) => {
                console.error(error);
                setUserValido(false);
            });
        } else {
            await apiUsuario.get('/validarUsuario/' + localCode).then((response) => {
                console.log(response.data);
                setCode(localCode);
                setUserValido(true);
                getAllUrls();
            }).catch((error) => {
                console.error(error);
                setUserValido(false);
            });
        }
    }


    return (
        <div className='container'>
            <h1>Biblioteca de Envio e Download de Imagens</h1>
            <div className='box'>
                <div className='boxImage'>
                    {userValido ? (
                        <div className='code'>
                            <h2>Código: {code}</h2>
                        </div>
                    ) : (
                        <div className='code'>
                            <h2>Informe o código</h2>
                            <input type="text" onChange={(e) => setCode(e.target.value)} />
                            <button onClick={handleSetCodigo}>Salvar</button>
                        </div>
                    )
                    }
                    <h2>Enviar Imagem</h2>
                    <input type="file" onChange={fileSelectedHandler} />
                    <button onClick={fileUploadHandler}>Upload</button>

                </div>
                <div className='boxImage'>
                    <button onClick={fileDownloadHandler}>Download</button>
                    <img src={image} alt="imagem" />
                </div>
            </div>
        </div>
    );
}

export default App;
