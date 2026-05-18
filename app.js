let table;
let masterData = [];

$(document).ready(function() {
    let usuarioInput = prompt("Control de Acceso Interno\nIngrese Usuario:");
    let claveInput = prompt("Ingrese Contraseña:");

    if (usuarioInput === "2026" && claveInput === "2026") {
        inicializarTema();
        iniciarCargaDeDatos();
    } else {
        alert("Credenciales incorrectas. Acceso denegado.");
        $('body').html('<div style="text-align:center; margin-top:150px; color:#ef4444; font-family:sans-serif;"><h2>🔒 Acceso Denegado</h2></div>');
    }

    function inicializarTema() {
        const temaGuardado = localStorage.getItem('theme') || 'dark';
        $('html').attr('data-theme', temaGuardado);
        actualizarIconosTema(temaGuardado);

        $('#themeToggleBtn').on('click', function() {
            let currentTheme = $('html').attr('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            $('html').attr('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            actualizarIconosTema(newTheme);
        });
    }

    function actualizarIconosTema(tema) {
        if (tema === 'light') {
            $('.icon-sun').removeClass('d-none');
            $('.icon-moon').addClass('d-none');
        } else {
            $('.icon-sun').addClass('d-none');
            $('.icon-moon').removeClass('d-none');
        }
    }

    function iniciarCargaDeDatos() {
        fetch('datos.json')
            .then(r => r.json())
            .then(data => {
                masterData = data;
                $('#totalCounter').text(masterData.length.toLocaleString() + ' registros totales');
                inicializarSistemaBuscador(masterData);
            })
            .catch(err => {
                $('#totalCounter').text("0 registros activos");
                inicializarSistemaBuscador([]);
            });
    }

    function inicializarSistemaBuscador(data) {
        table = $('#personalTable').DataTable({
            data: data,
            deferRender: true,
            pageLength: 15,
            lengthMenu: [10, 15, 30, 50, 100],
            order: [[0, 'asc']],
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6">>rt<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
            columns: [
                { data: "N.Ord", defaultContent: "" },
                { data: "Escalafon", defaultContent: "" },
                { data: "Grado", defaultContent: "" },
                { data: "Apellidos y Nombres", defaultContent: "" },
                { data: "Codigo Funcionario", defaultContent: "" },
                { data: "Estado Civil", defaultContent: "" },
                { data: "Fecha Nacimiento", defaultContent: "" },
                { data: "Fecha Ingreso", defaultContent: "" },
                { data: "Fecha Ascenso", defaultContent: "" },
                { data: "Observaciones", defaultContent: "" },
                { data: "Observaciones 2", defaultContent: "" }
            ]
        });

        function filtrar() {
            let n = $('#searchName').val().toLowerCase().trim();
            let c = $('#searchCode').val().toLowerCase().trim();
            let g = $('#searchGrado').val().toLowerCase().trim();

            if (!n && !c && !g) {
                table.clear().rows.add(masterData).draw();
                $('#totalCounter').text(masterData.length.toLocaleString() + ' registros totales');
                return;
            }

            let fil = masterData.filter(r => {
                let txtN = (r["Apellidos y Nombres"] || "").toLowerCase();
                let txtC = (r["Codigo Funcionario"] || "").toLowerCase();
                let txtG = (r["Grado"] || "").toLowerCase();
                let txtE = (r["Escalafon"] || "").toLowerCase();

                if (n && !n.split(" ").every(t => txtN.includes(t))) return false;
                if (c && !txtC.includes(c)) return false;
                if (g && !txtG.includes(g) && !txtE.includes(g)) return false;
                return true;
            });

            table.clear().rows.add(fil).draw();
            $('#totalCounter').text(fil.length.toLocaleString() + 'coincidencias');
        }

        $('#searchName, #searchCode, #searchGrado').on('input', filtrar);
        $('#resetFilters').on('click', function() {
            $('#searchName').val(''); $('#searchCode').val(''); $('#searchGrado').val('');
            table.clear().rows.add(masterData).draw();
            $('#totalCounter').text(masterData.length.toLocaleString() + ' registros totales');
        });
    }

    // CORRECCIÓN CRÍTICA DE CARGA MASIVA EXCEL (30.000+ FILAS SIN TRUNCAR)
    const fileInput = $('#excelFileInput');
    fileInput.on('change', function(e) {
        if (e.target.files.length === 0) return;
        let file = e.target.files[0];
        let reader = new FileReader();
        $('#fileUploadStatus').removeClass('d-none alert-danger alert-success').addClass('alert-info').text("Procesando matriz masiva de datos (Lectura Completa)...");
        
        reader.onload = function(evt) {
            try {
                let data = new Uint8Array(evt.target.result);
                
                // Forzar lectura binaria en crudo para evitar truncamientos por límite de strings del navegador
                let workbook = XLSX.read(data, { 
                    type: 'array', 
                    cellDates: true, 
                    cellNF: false, 
                    cellText: false 
                });
                
                let firstSheetName = workbook.SheetNames[0];
                let worksheet = workbook.Sheets[firstSheetName];
                
                // Leer el rango real completo del documento ignorando límites parciales de paginado Excel
                let rawData = XLSX.utils.sheet_to_json(worksheet, { 
                    defval: "", 
                    raw: true 
                });
                
                if (!rawData || rawData.length === 0) {
                    throw new Error("El archivo no contiene filas procesables.");
                }

                // Mapeo Inteligente sin truncar índices
                masterData = rawData.map(row => {
                    let normalizado = {};
                    let buscarValor = (clavesPosibles) => {
                        for (let k of Object.keys(row)) {
                            let kClean = k.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
                            if (clavesPosibles.includes(kClean)) return row[k];
                        }
                        return "";
                    };

                    normalizado["N.Ord"] = buscarValor(["n.ord", "nord", "numero", "n° ord", "n°ord", "orden"]);
                    normalizado["Escalafon"] = buscarValor(["escalafon", "escalafón", "esc", "esc. de o. y s."]);
                    normalizado["Grado"] = buscarValor(["grado", "grad"]);
                    normalizado["Apellidos y Nombres"] = buscarValor(["apellidos y nombres", "nombre", "nombres", "nombre completo", "personal"]);
                    normalizado["Codigo Funcionario"] = buscarValor(["codigo funcionario", "codigo", "cod.func.", "cod. func.", "cod_func", "funcionario"]);
                    normalizado["Estado Civil"] = buscarValor(["estado civil", "e.civil", "ecivil", "est.civil"]);
                    
                    // Formatear fechas en texto limpio en caso de venir procesadas como objetos Date por la librería masiva
                    let formatFecha = (val) => {
                        if (val instanceof Date) {
                            return val.toISOString().split('T')[0];
                        }
                        return val;
                    };

                    normalizado["Fecha Nacimiento"] = formatFecha(buscarValor(["fecha nacimiento", "fec-nac", "fecha nac", "fec_nac", "nacimiento"]));
                    normalizado["Fecha Ingreso"] = formatFecha(buscarValor(["fecha ingreso", "fec-ing", "fecha ing", "fec_ing", "ingreso"]));
                    normalizado["Fecha Ascenso"] = formatFecha(buscarValor(["fecha ascenso", "fec-asc", "fecha asc", "fec_asc", "ascenso"]));
                    normalizado["Observaciones"] = buscarValor(["observaciones", "obs", "observacion"]);
                    normalizado["Observaciones 2"] = buscarValor(["observaciones 2", "observaciones2", "obs2", "column11"]);

                    return normalizado;
                });

                // Re-inicializar tabla en DataTables de forma limpia con los 30.000 registros completos
                table.clear().rows.add(masterData).draw();
                $('#totalCounter').text(masterData.length.toLocaleString() + ' registros totales');
                $('#fileUploadStatus').removeClass('alert-info').addClass('alert-success').html(`<strong>¡Procesamiento Masivo Exitoso!</strong> Se normalizaron y cargaron las <strong>${masterData.length.toLocaleString()}</strong> filas completas del Excel sin truncamientos.`);
                $('#btnDownloadJson').removeClass('d-none');
            } catch (err) {
                console.error(err);
                $('#fileUploadStatus').removeClass('alert-info').addClass('alert-danger').text("Error: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    });
    
    $('#btnDownloadJson').on('click', function() {
        let blob = new Blob([JSON.stringify(masterData, null, 2)], { type: 'application/json' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'datos.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
});
