// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let currentInvoice = null;
    let isEditing = false;

    // Initialisation
    initApp();

    // Fonctions d'initialisation
    function initApp() {
        // Charger les données de démo si vide
        if (clients.length === 0) loadDemoClients();
        if (products.length === 0) loadDemoProducts();
        if (invoices.length === 0) loadDemoInvoices();

        // Initialiser les événements
        setupEventListeners();

        // Afficher la liste des factures
        renderInvoiceList();
        renderClientSelect();
        renderProductSelects();

        // Par défaut, afficher le formulaire de nouvelle facture
        showInvoiceEditView();
    }

    function loadDemoClients() {
        clients = [
            { id: 1, name: "Client A", email: "client.a@example.com", address: "123 Rue Principale, Paris", phone: "01 23 45 67 89" },
            { id: 2, name: "Client B", email: "client.b@example.com", address: "456 Avenue Centrale, Lyon", phone: "04 56 78 90 12" }
        ];
        saveClients();
    }

    function loadDemoProducts() {
        products = [
            { id: 1, name: "Produit A", price: 100, description: "Description du produit A" },
            { id: 2, name: "Produit B", price: 200, description: "Description du produit B" },
            { id: 3, name: "Produit C", price: 150, description: "Description du produit C" }
        ];
        saveProducts();
    }

    function loadDemoInvoices() {
        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 30);
        
        invoices = [
            {
                id: 1,
                number: "FAC-2023-001",
                clientId: 1,
                date: today.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                status: "paid",
                currency: "EUR",
                items: [
                    { productId: 1, quantity: 2, price: 100, tax: 20 },
                    { productId: 2, quantity: 1, price: 200, tax: 20 }
                ],
                notes: "Merci pour votre confiance",
                terms: "Paiement dans les 30 jours",
                discount: 0
            },
            {
                id: 2,
                number: "FAC-2023-002",
                clientId: 2,
                date: today.toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                status: "sent",
                currency: "EUR",
                items: [
                    { productId: 3, quantity: 3, price: 150, tax: 10 }
                ],
                notes: "",
                terms: "Paiement dans les 15 jours",
                discount: 5
            }
        ];
        saveInvoices();
    }

    // Fonctions de gestion des données
    function saveInvoices() {
        localStorage.setItem('invoices', JSON.stringify(invoices));
    }

    function saveClients() {
        localStorage.setItem('clients', JSON.stringify(clients));
    }

    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Fonctions d'affichage
    function renderInvoiceList(filter = '') {
        const invoiceList = document.getElementById('invoiceList');
        invoiceList.innerHTML = '';

        const filteredInvoices = invoices.filter(invoice => {
            const searchTerm = filter.toLowerCase();
            const client = clients.find(c => c.id === invoice.clientId);
            const clientName = client ? client.name.toLowerCase() : '';
            
            return (
                invoice.number.toLowerCase().includes(searchTerm) ||
                clientName.includes(searchTerm) ||
                invoice.status.includes(searchTerm)
            );
        });

        if (filteredInvoices.length === 0) {
            invoiceList.innerHTML = '<div class="text-center py-3 text-muted">Aucune facture trouvée</div>';
            return;
        }

        filteredInvoices.forEach(invoice => {
            const client = clients.find(c => c.id === invoice.clientId);
            const template = document.getElementById('invoiceListItemTemplate').content.cloneNode(true);
            
            template.querySelector('.invoice-list-item').dataset.id = invoice.id;
            template.querySelector('.invoice-list-number').textContent = invoice.number;
            template.querySelector('.invoice-list-date').textContent = formatDate(invoice.date);
            template.querySelector('.invoice-list-client').textContent = client ? client.name : 'Client inconnu';
            template.querySelector('.invoice-list-total').textContent = formatCurrency(calculateInvoiceTotal(invoice), invoice.currency);
            
            const statusBadge = template.querySelector('.invoice-list-status');
            statusBadge.textContent = getStatusText(invoice.status);
            statusBadge.className = `badge bg-status-${invoice.status}`;
            
            invoiceList.appendChild(template);
        });
    }

    function renderClientSelect() {
        const select = document.getElementById('invoiceClientSelect');
        select.innerHTML = '<option value="" selected disabled>Sélectionnez un client</option>';
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);
        });
    }

    function renderProductSelects() {
        const selects = document.querySelectorAll('.product-select');
        
        selects.forEach(select => {
            // Sauvegarder la valeur sélectionnée actuelle
            const currentValue = select.value;
            select.innerHTML = '<option value="" selected disabled>Sélectionnez un produit</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - ${formatCurrency(product.price, 'EUR')}`;
                select.appendChild(option);
            });
            
            // Restaurer la valeur sélectionnée si elle existe toujours
            if (currentValue && products.some(p => p.id.toString() === currentValue)) {
                select.value = currentValue;
            }
        });
    }

    function renderInvoiceDetail(invoice) {
        const client = clients.find(c => c.id === invoice.clientId);
        
        document.getElementById('detailInvoiceNumber').textContent = invoice.number;
        document.getElementById('detailClientName').textContent = client ? client.name : 'Client inconnu';
        document.getElementById('detailInvoiceDate').textContent = formatDate(invoice.date);
        document.getElementById('detailDueDate').textContent = formatDate(invoice.dueDate);
        document.getElementById('detailCurrency').textContent = invoice.currency;
        
        const statusBadge = document.getElementById('detailStatus');
        statusBadge.textContent = getStatusText(invoice.status);
        statusBadge.className = `badge bg-status-${invoice.status}`;
        
        // Rendre les articles
        const itemsTable = document.getElementById('detailItemsTable');
        itemsTable.innerHTML = '';
        
        invoice.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${formatCurrency(item.price, invoice.currency)}</td>
                <td>${item.quantity}</td>
                <td>${item.tax}%</td>
                <td>${formatCurrency(item.price * item.quantity * (1 + item.tax / 100), invoice.currency)}</td>
            `;
            itemsTable.appendChild(row);
        });
        
        // Calculer et afficher les totaux
        const subtotal = calculateSubtotal(invoice);
        const total = calculateInvoiceTotal(invoice);
        
        document.getElementById('detailSubtotal').textContent = formatCurrency(subtotal, invoice.currency);
        document.getElementById('detailTotal').textContent = formatCurrency(total, invoice.currency);
        document.getElementById('detailTotalAmount').textContent = formatCurrency(total, invoice.currency);
        
        // Afficher les taxes
        const taxesContainer = document.getElementById('detailTaxesContainer');
        taxesContainer.innerHTML = '';
        
        const taxes = calculateTaxes(invoice);
        taxes.forEach(tax => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between mb-2';
            div.innerHTML = `
                <span>TVA ${tax.rate}%:</span>
                <span>${formatCurrency(tax.amount, invoice.currency)}</span>
            `;
            taxesContainer.appendChild(div);
        });
        
        // Afficher la remise
        document.getElementById('detailDiscount').textContent = invoice.discount > 0 ? 
            `${invoice.discount}% (-${formatCurrency(subtotal * invoice.discount / 100, invoice.currency)})` : 
            formatCurrency(0, invoice.currency);
        
        // Afficher les notes et conditions
        document.getElementById('detailNotes').textContent = invoice.notes || 'Aucune note';
        document.getElementById('detailTerms').textContent = invoice.terms || 'Aucune condition spécifiée';
    }

    function renderInvoiceEditForm(invoice = null) {
        // Réinitialiser le formulaire
        document.getElementById('invoiceClientSelect').value = '';
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('invoiceDueDate').value = dueDate.toISOString().split('T')[0];
        
        document.getElementById('invoiceCurrency').value = 'EUR';
        document.getElementById('invoiceNotes').value = '';
        document.getElementById('invoiceTerms').value = '';
        document.getElementById('invoiceDiscount').value = 0;
        
        const itemsBody = document.getElementById('invoiceItemsBody');
        itemsBody.innerHTML = '';
        
        // Si on édite une facture existante, remplir le formulaire
        if (invoice) {
            document.getElementById('invoiceClientSelect').value = invoice.clientId;
            document.getElementById('invoiceDate').value = invoice.date;
            document.getElementById('invoiceDueDate').value = invoice.dueDate;
            document.getElementById('invoiceCurrency').value = invoice.currency;
            document.getElementById('invoiceNotes').value = invoice.notes || '';
            document.getElementById('invoiceTerms').value = invoice.terms || '';
            document.getElementById('invoiceDiscount').value = invoice.discount || 0;
            
            // Ajouter les articles
            invoice.items.forEach(item => {
                addInvoiceItemRow(item);
            });
        } else {
            // Ajouter une ligne vide par défaut
            addInvoiceItemRow();
        }
        
        updateInvoiceTotals();
    }

    function addInvoiceItemRow(item = null) {
        const template = document.getElementById('invoiceItemTemplate').content.cloneNode(true);
        const row = template.querySelector('tr');
        
        if (item) {
            const productSelect = row.querySelector('.product-select');
            productSelect.value = item.productId;
            
            const priceInput = row.querySelector('.price-input');
            priceInput.value = item.price;
            
            const taxSelect = row.querySelector('.tax-select');
            taxSelect.value = item.tax;
            
            const quantityInput = row.querySelector('.quantity-input');
            quantityInput.value = item.quantity;
            
            const itemTotal = row.querySelector('.item-total');
            itemTotal.textContent = formatCurrency(item.price * item.quantity * (1 + item.tax / 100), document.getElementById('invoiceCurrency').value);
        }
        
        document.getElementById('invoiceItemsBody').appendChild(row);
        renderProductSelects();
        setupInvoiceItemEventListeners(row);
    }

    // Fonctions de calcul
    function calculateSubtotal(invoice) {
        return invoice.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (item.price * item.quantity);
        }, 0);
    }

    function calculateTaxes(invoice) {
        const taxesMap = new Map();
        
        invoice.items.forEach(item => {
            if (!taxesMap.has(item.tax)) {
                taxesMap.set(item.tax, 0);
            }
            taxesMap.set(item.tax, taxesMap.get(item.tax) + (item.price * item.quantity * item.tax / 100));
        });
        
        return Array.from(taxesMap.entries()).map(([rate, amount]) => ({
            rate,
            amount
        }));
    }

    function calculateInvoiceTotal(invoice) {
        const subtotal = calculateSubtotal(invoice);
        const taxes = calculateTaxes(invoice).reduce((sum, tax) => sum + tax.amount, 0);
        const discountAmount = subtotal * (invoice.discount || 0) / 100;
        return subtotal + taxes - discountAmount;
    }

    function updateInvoiceTotals() {
        const currency = document.getElementById('invoiceCurrency').value;
        const discount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
        
        // Calculer le sous-total
        let subtotal = 0;
        const itemRows = document.querySelectorAll('#invoiceItemsBody tr');
        
        itemRows.forEach(row => {
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
            subtotal += price * quantity;
            
            // Mettre à jour le total de la ligne
            const taxRate = parseFloat(row.querySelector('.tax-select').value) || 0;
            const itemTotal = price * quantity * (1 + taxRate / 100);
            row.querySelector('.item-total').textContent = formatCurrency(itemTotal, currency);
        });
        
        // Calculer les taxes
        const taxesContainer = document.getElementById('invoiceTaxesContainer');
        taxesContainer.innerHTML = '';
        
        const taxesMap = new Map();
        itemRows.forEach(row => {
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
            const taxRate = parseFloat(row.querySelector('.tax-select').value) || 0;
            
            if (taxRate > 0) {
                const taxAmount = price * quantity * taxRate / 100;
                
                if (!taxesMap.has(taxRate)) {
                    taxesMap.set(taxRate, 0);
                }
                taxesMap.set(taxRate, taxesMap.get(taxRate) + taxAmount);
            }
        });
        
        // Afficher les taxes
        taxesMap.forEach((amount, rate) => {
            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between mb-2';
            div.innerHTML = `
                <span>TVA ${rate}%:</span>
                <span>${formatCurrency(amount, currency)}</span>
            `;
            taxesContainer.appendChild(div);
        });
        
        const taxesTotal = Array.from(taxesMap.values()).reduce((sum, amount) => sum + amount, 0);
        const discountAmount = subtotal * discount / 100;
        const total = subtotal + taxesTotal - discountAmount;
        
        // Mettre à jour les totaux dans l'UI
        document.getElementById('invoiceSubtotal').textContent = formatCurrency(subtotal, currency);
        document.getElementById('invoiceTotal').textContent = formatCurrency(total, currency);
    }

    // Fonctions d'état de l'interface
    function showInvoiceEditView() {
        document.getElementById('invoiceEditView').style.display = 'block';
        document.getElementById('invoiceDetailView').style.display = 'none';
        document.getElementById('invoiceViewTitle').textContent = currentInvoice ? `Modifier ${currentInvoice.number}` : 'Nouvelle Facture';
        isEditing = true;
    }

    function showInvoiceDetailView() {
        document.getElementById('invoiceEditView').style.display = 'none';
        document.getElementById('invoiceDetailView').style.display = 'block';
        document.getElementById('invoiceViewTitle').textContent = currentInvoice.number;
        isEditing = false;
    }

    // Fonctions utilitaires
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }

    function formatCurrency(amount, currency) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency || 'EUR'
        }).format(amount);
    }

    function getStatusText(status) {
        const statusTexts = {
            'draft': 'Brouillon',
            'sent': 'Envoyée',
            'paid': 'Payée',
            'overdue': 'En retard'
        };
        return statusTexts[status] || status;
    }

    function generateInvoiceNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const lastInvoice = invoices.reduce((prev, current) => 
            (prev.id > current.id) ? prev : current, {id: 0});
        
        const nextId = lastInvoice.id + 1;
        return `FAC-${year}-${String(nextId).padStart(3, '0')}`;
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.createElement('div');
        toastContainer.className = `toast-container position-fixed bottom-0 end-0 p-3`;
        
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-bg-${type} border-0`;
        toast.role = 'alert';
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        document.body.appendChild(toastContainer);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toastContainer.remove(), 300);
        }, 3000);
    }

    // Gestion des événements
    function setupEventListeners() {
        // Bouton nouvelle facture
        document.getElementById('newInvoiceBtn').addEventListener('click', () => {
            currentInvoice = null;
            renderInvoiceEditForm();
            showInvoiceEditView();
        });
        
        // Recherche de factures
        document.getElementById('invoiceSearch').addEventListener('input', (e) => {
            renderInvoiceList(e.target.value);
        });
        
        // Sauvegarder comme brouillon
        document.getElementById('saveDraftBtn').addEventListener('click', saveInvoiceAsDraft);
        
        // Enregistrer la facture
        document.getElementById('saveInvoiceBtn').addEventListener('click', saveInvoice);
        
        // Annuler l'édition
        document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
        
        // Bouton ajouter un article
        document.getElementById('addInvoiceItemBtn').addEventListener('click', () => {
            addInvoiceItemRow();
        });
        
        // Gestion des clients
        document.getElementById('manageClientsBtn').addEventListener('click', showClientsModal);
        
        // Gestion des produits
        document.getElementById('manageProductsBtn').addEventListener('click', showProductsModal);
        
        // Événements sur la liste des factures (délégués)
        document.getElementById('invoiceList').addEventListener('click', (e) => {
            const listItem = e.target.closest('.invoice-list-item');
            if (listItem) {
                e.preventDefault();
                const invoiceId = parseInt(listItem.dataset.id);
                loadInvoice(invoiceId);
            }
        });
        
        // Événements sur la vue détaillée
        document.getElementById('editInvoiceBtn').addEventListener('click', () => {
            if (currentInvoice) {
                renderInvoiceEditForm(currentInvoice);
                showInvoiceEditView();
            }
        });
        
        document.getElementById('downloadInvoiceBtn').addEventListener('click', generatePdf);
        document.getElementById('sendInvoiceBtn').addEventListener('click', showEmailModal);
        
        // Événements sur les champs du formulaire
        document.getElementById('invoiceCurrency').addEventListener('change', updateInvoiceTotals);
        document.getElementById('invoiceDiscount').addEventListener('input', updateInvoiceTotals);
    }

    function setupInvoiceItemEventListeners(row) {
        const productSelect = row.querySelector('.product-select');
        const priceInput = row.querySelector('.price-input');
        const taxSelect = row.querySelector('.tax-select');
        const quantityInput = row.querySelector('.quantity-input');
        const removeBtn = row.querySelector('.remove-item-btn');
        
        productSelect.addEventListener('change', (e) => {
            const productId = e.target.value;
            const product = products.find(p => p.id.toString() === productId);
            if (product) {
                priceInput.value = product.price;
                updateInvoiceTotals();
            }
        });
        
        priceInput.addEventListener('input', updateInvoiceTotals);
        taxSelect.addEventListener('change', updateInvoiceTotals);
        quantityInput.addEventListener('input', updateInvoiceTotals);
        
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            row.remove();
            updateInvoiceTotals();
        });
    }

    // Fonctions de gestion des factures
    function loadInvoice(invoiceId) {
        currentInvoice = invoices.find(i => i.id === invoiceId);
        if (currentInvoice) {
            renderInvoiceDetail(currentInvoice);
            showInvoiceDetailView();
        }
    }

    function saveInvoiceAsDraft() {
        saveInvoice('draft');
    }

    function saveInvoice(status = 'sent') {
        // Validation du formulaire
        const clientId = document.getElementById('invoiceClientSelect').value;
        const date = document.getElementById('invoiceDate').value;
        const dueDate = document.getElementById('invoiceDueDate').value;
        const currency = document.getElementById('invoiceCurrency').value;
        const discount = parseFloat(document.getElementById('invoiceDiscount').value) || 0;
        
        if (!clientId || !date || !dueDate) {
            showToast('Veuillez remplir tous les champs obligatoires', 'danger');
            return;
        }
        
        // Validation des articles
        const items = [];
        const itemRows = document.querySelectorAll('#invoiceItemsBody tr');
        
        if (itemRows.length === 0) {
            showToast('Veuillez ajouter au moins un article', 'danger');
            return;
        }
        
        let hasErrors = false;
        itemRows.forEach(row => {
            const productId = row.querySelector('.product-select').value;
            const price = parseFloat(row.querySelector('.price-input').value);
            const tax = parseFloat(row.querySelector('.tax-select').value);
            const quantity = parseInt(row.querySelector('.quantity-input').value);
            
            if (!productId || isNaN(price) || isNaN(quantity) || quantity < 1) {
                hasErrors = true;
                return;
            }
            
            items.push({
                productId: parseInt(productId),
                price,
                tax,
                quantity
            });
        });
        
        if (hasErrors) {
            showToast('Veuillez vérifier les informations des articles', 'danger');
            return;
        }
        
        // Créer ou mettre à jour la facture
        const invoiceData = {
            clientId: parseInt(clientId),
            date,
            dueDate,
            currency,
            items,
            notes: document.getElementById('invoiceNotes').value,
            terms: document.getElementById('invoiceTerms').value,
            discount,
            status
        };
        
        if (currentInvoice) {
            // Mise à jour de la facture existante
            Object.assign(currentInvoice, invoiceData);
            showToast('Facture mise à jour avec succès');
        } else {
            // Création d'une nouvelle facture
            const newInvoice = {
                id: invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1,
                number: generateInvoiceNumber(),
                ...invoiceData
            };
            
            invoices.push(newInvoice);
            currentInvoice = newInvoice;
            showToast('Facture créée avec succès');
        }
        
        saveInvoices();
        renderInvoiceList();
        renderInvoiceDetail(currentInvoice);
        showInvoiceDetailView();
    }

    function cancelEdit() {
        if (currentInvoice) {
            renderInvoiceDetail(currentInvoice);
            showInvoiceDetailView();
        } else {
            document.getElementById('invoiceList').innerHTML = '';
            renderInvoiceList();
            document.getElementById('invoiceEditView').style.display = 'none';
            document.getElementById('invoiceDetailView').style.display = 'none';
        }
    }

    // Gestion des clients
    function showClientsModal() {
        const modal = new bootstrap.Modal(document.getElementById('clientsModal'));
        renderClientsTable();
        modal.show();
    }

    function renderClientsTable() {
        const tbody = document.getElementById('clientsTableBody');
        tbody.innerHTML = '';
        
        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-client-btn" data-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Ajouter les événements après le rendu
        document.querySelectorAll('.delete-client-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = parseInt(e.currentTarget.dataset.id);
                deleteClient(clientId);
            });
        });
        
        document.getElementById('addClientBtn').addEventListener('click', addNewClient);
    }

    function addNewClient() {
        const name = prompt("Nom du client:");
        if (!name) return;
        
        const email = prompt("Email du client:");
        if (!email) return;
        
        const newClient = {
            id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
            name,
            email
        };
        
        clients.push(newClient);
        saveClients();
        renderClientsTable();
        renderClientSelect();
        showToast('Client ajouté avec succès');
    }

    function deleteClient(clientId) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
            clients = clients.filter(c => c.id !== clientId);
            saveClients();
            renderClientsTable();
            renderClientSelect();
            showToast('Client supprimé avec succès');
        }
    }

    // Gestion des produits
    function showProductsModal() {
        const modal = new bootstrap.Modal(document.getElementById('productsModal'));
        renderProductsTable();
        modal.show();
    }

    function renderProductsTable() {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = '';
        
        products.forEach(product => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${product.name}</td>
                <td>${formatCurrency(product.price, 'EUR')}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-product-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Ajouter les événements après le rendu
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                deleteProduct(productId);
            });
        });
        
        document.getElementById('addProductBtn').addEventListener('click', addNewProduct);
    }

    function addNewProduct() {
        const name = prompt("Nom du produit:");
        if (!name) return;
        
        const price = parseFloat(prompt("Prix du produit:"));
        if (isNaN(price)) return;
        
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name,
            price
        };
        
        products.push(newProduct);
        saveProducts();
        renderProductsTable();
        renderProductSelects();
        showToast('Produit ajouté avec succès');
    }

    function deleteProduct(productId) {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
            products = products.filter(p => p.id !== productId);
            saveProducts();
            renderProductsTable();
            renderProductSelects();
            showToast('Produit supprimé avec succès');
        }
    }

    // Envoi d'email
    function showEmailModal() {
        if (!currentInvoice) return;
        
        const client = clients.find(c => c.id === currentInvoice.clientId);
        const modal = new bootstrap.Modal(document.getElementById('emailModal'));
        
        if (client && client.email) {
            document.getElementById('recipientEmail').value = client.email;
        }
        
        document.getElementById('emailSubject').value = `Facture ${currentInvoice.number}`;
        document.getElementById('emailMessage').value = `Bonjour,\n\nVeuillez trouver ci-joint votre facture ${currentInvoice.number} d'un montant de ${formatCurrency(calculateInvoiceTotal(currentInvoice), currentInvoice.currency)}.\n\nCordialement`;
        
        document.getElementById('sendEmailBtn').addEventListener('click', () => {
            const email = document.getElementById('recipientEmail').value;
            if (!email) {
                showToast('Veuillez entrer une adresse email', 'danger');
                return;
            }
            
            // Simuler l'envoi d'email
            setTimeout(() => {
                modal.hide();
                showToast(`Facture envoyée à ${email}`);
                
                // Mettre à jour le statut si ce n'est pas déjà fait
                if (currentInvoice.status === 'draft') {
                    currentInvoice.status = 'sent';
                    saveInvoices();
                    renderInvoiceDetail(currentInvoice);
                    renderInvoiceList();
                }
            }, 1000);
        });
        
        modal.show();
    }

    // Génération de PDF
    function generatePdf() {
        if (!currentInvoice) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const client = clients.find(c => c.id === currentInvoice.clientId);
        const date = formatDate(currentInvoice.date);
        const dueDate = formatDate(currentInvoice.dueDate);
        
        // En-tête
        doc.setFontSize(20);
        doc.text('FACTURE', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`N° ${currentInvoice.number}`, 105, 30, { align: 'center' });
        
        // Informations de la société
        doc.setFontSize(10);
        doc.text('Votre Société', 20, 40);
        doc.text('123 Rue des Entreprises', 20, 45);
        doc.text('75000 Paris, France', 20, 50);
        doc.text('contact@votresociete.com', 20, 55);
        
        // Informations du client
        doc.text('Facturé à:', 20, 70);
        if (client) {
            doc.text(client.name, 20, 75);
            if (client.address) doc.text(client.address, 20, 80);
            if (client.email) doc.text(client.email, 20, 85);
        }
        
        // Détails de la facture
        doc.text(`Date de facturation: ${date}`, 140, 70);
        doc.text(`Date d'échéance: ${dueDate}`, 140, 75);
        doc.text(`Statut: ${getStatusText(currentInvoice.status)}`, 140, 80);
        
        // Tableau des articles
        doc.autoTable({
            startY: 100,
            head: [['Produit', 'Prix unitaire', 'Quantité', 'TVA', 'Total']],
            body: currentInvoice.items.map(item => {
                const product = products.find(p => p.id === item.productId);
                return [
                    product ? product.name : 'Produit inconnu',
                    formatCurrency(item.price, currentInvoice.currency),
                    item.quantity,
                    `${item.tax}%`,
                    formatCurrency(item.price * item.quantity * (1 + item.tax / 100), currentInvoice.currency)
                ];
            }),
            margin: { left: 20 },
            styles: { fontSize: 9 },
            headStyles: { fillColor: [241, 243, 245] }
        });
        
        // Totaux
        const subtotal = calculateSubtotal(currentInvoice);
        const taxes = calculateTaxes(currentInvoice);
        const total = calculateInvoiceTotal(currentInvoice);
        
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            body: [
                ['Sous-total:', formatCurrency(subtotal, currentInvoice.currency)],
                ...taxes.map(tax => [`TVA ${tax.rate}%:`, formatCurrency(tax.amount, currentInvoice.currency)]),
                ['Remise:', `${currentInvoice.discount}% (-${formatCurrency(subtotal * currentInvoice.discount / 100, currentInvoice.currency)})`],
                ['Total:', { content: formatCurrency(total, currentInvoice.currency), styles: { fontStyle: 'bold' }}]
            ],
            margin: { left: 120 },
            styles: { fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });
        
        // Notes
        if (currentInvoice.notes) {
            doc.text('Notes:', 20, doc.lastAutoTable.finalY + 15);
            doc.text(currentInvoice.notes, 20, doc.lastAutoTable.finalY + 20, { maxWidth: 170 });
        }
        
        // Conditions
        if (currentInvoice.terms) {
            doc.text('Conditions de paiement:', 20, doc.lastAutoTable.finalY + 30);
            doc.text(currentInvoice.terms, 20, doc.lastAutoTable.finalY + 35, { maxWidth: 170 });
        }
        
        // Enregistrer le PDF
        doc.save(`facture_${currentInvoice.number}.pdf`);
        showToast('PDF généré avec succès');
    }
});