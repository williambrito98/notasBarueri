const pdf = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const InputDirectory = path.join(__dirname, 'entrada');
let string = 'PRESTADOR;NOTA;VALOR;CNPJ;INSS;DATA;CODIGO_SERVICO;DESCRICAO;STATUS;ARQUIVO\n';

(async () => {
    //fs.appendFileSync('saida.csv', string, { encoding: 'latin1' })

    const dir = fs.readdirSync(InputDirectory).sort()
    for (let index = 0; index < dir.length; index++) {
        try {
            console.log(dir[index])
            let dataBuffer = fs.readFileSync(path.join(InputDirectory, dir[index]));
            let contentPdf = (await pdf(dataBuffer)).text;
            //console.log(contentPdf.split('\n'))
            let prestador = contentPdf.match(/Valor Total\n.+/gi);
            prestador = prestador ? prestador[0].replace('Valor Total', '').trim() : ''
            let nota = contentPdf.match(/Número da Nota\n.+/gi)
            nota = nota ? nota[0].replace('Número da Nota', '').trim() : ''
            let cnpj = contentPdf.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/gim)
            cnpj = cnpj && cnpj[1] ? cnpj[1].replace('CNPJ/CPF', '').trim() : ''
            let INSS = contentPdf.match(/Retido de INSS:.+/gi)
            INSS = INSS ? INSS[0].replace('Retido de INSS:', '').trim() : ''
            let status = contentPdf.match(/Cancelada em/gi)
            status = status ? 'cancelada' : 'OK'
            if (contentPdf.split('\n')[2].toLowerCase() === 'cancelada') {
                status = 'cancelada'
            }
            let valorTotal = contentPdf.match(/VALOR TOTAL DA NOTA.+/gi)
            valorTotal = valorTotal ? valorTotal[0].replace('VALOR TOTAL DA NOTA', '').trim() : ''
            let descricao = ''
            if (contentPdf.includes('Descrição do Serviço')) {
                let i = contentPdf.split('\n')[41].includes('DISCRIMINAÇÃO DOS SERVIÇOS E INFORMAÇÕES RELEVANTES') || contentPdf.split('\n')[41].includes('@') ? 42 : 41
                descricao = contentPdf.split('\n')[i].replace(/[0-9]/gi, '').replace(/\./g, '').replace(/\,/g, '')

            }
            let dataEmissao = ''
            if (contentPdf.includes('Data EmissãoHora Emissão')) {
                dataEmissao = contentPdf.match(/Data EmissãoHora Emissão\n.+/gi)[0].replace('Data EmissãoHora Emissão', '').trim().slice(0, 10)
            }
            let codigoServico = ''
            if (contentPdf.includes('Código Serviço')) {
                let i = contentPdf.split('\n')[41].includes('@') ? 42 : 41
                codigoServico = contentPdf.split('\n')[i].replace(/[a-z]|Ç|Ã|Ó|É|Õ/gi, '').replace(/\s/, ',').split(',').filter(item => item.trim() != '')
                codigoServico = codigoServico[0].trim() == '1' ? codigoServico[1].slice(0, -1) : codigoServico[0].slice(0, -1)
            }

            // console.log(codigoServico)
            string = prestador + ';' + nota + ';' + valorTotal + ';' + cnpj + ';' + INSS + ';' + dataEmissao + ';' + codigoServico + ';' + descricao + ';' + status + ';' + dir[index] + '\n';
            fs.appendFileSync('saida.csv', string, { encoding: 'latin1' })

            //          process.exit()
        } catch (error) {
            console.log(error)
            process.exit()
        }

    }






})()