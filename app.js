let table;
let masterData = [];

$(document).ready(function() {
    let usuarioInput = prompt("Control de Acceso Interno\nIngrese Usuario:");
    let claveInput = prompt("Ingrese Contraseña:");

    if (usuarioInput === "2026" && claveInput === "2026") {
        iniciarCargaDeDatos();
    } else {
        alert("Credenciales incorrectas. Acceso denegado.");
        $('body').html('<div style="text-align:center; margin-top:150px; color:#ef4444; font-family:sans-serif;"><h2>🔒 Acceso Denegado</h2><p>Consulte al administrador del sistema.</p></div>');
    }

    function iniciarCargaDeDatos() {
        fetch('datos.json')
            .then(r => r.json())
            .then(data => {
                masterData = data;
                $('#totalCounter').text(masterData.length.toLocaleString() + ' registros');
                inicializarSistemaBuscador(masterData);
            })
            .catch(err => {
                console.error("No se pudo cargar datos.json:", err);
                $('#totalCounter').text("0 registros");
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
            dom: '<"row"<"col-12"l>>rt<"row"<"col-12 text-center"i><"col-12 d-flex justify-content-center"p>>',
            language: { 
                url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
                paginate: {
                    first: "«",
                    previous: "‹",
                    next: "›",
                    last: "»"
                }
            },
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
                $('#totalCounter').text(masterData.length.toLocaleString() + ' registros');
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
            $('#totalCounter').text(fil.length.toLocaleString() + ' encontrados');
        }

        $('#searchName, #searchCode, #searchGrado').on('input', filtrar);
        $('#resetFilters').on('click', function() {
            $('#searchName').val(''); $('#searchCode').val(''); $('#searchGrado').val('');
            table.clear().rows.add(masterData).draw();
            $('#totalCounter').text(masterData.length.toLocaleString() + ' registros');
        });
    }
});
