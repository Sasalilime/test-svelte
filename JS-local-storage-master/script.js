const name = () => {
  let sayHello = document.getElementById('sayHello');
  let nameStorage = localStorage.getItem('nom');

  if (nameStorage == null){
    sayHello.innerHTML = "Bonjour à toi l'inconnu, merci de renseigner ton pseudo";
  } else {
    sayHello.innerHTML = `Bonjour ${nameStorage}`;
  }
};

const visit = () => {
  let visitDisplay = document.getElementById('visitDisplay');
  let visitCount = localStorage.getItem('visites');

  visitCount++;
  localStorage.setItem('visites', visitCount);
  visitDisplay.innerHTML = `Nombre de visites : ${visitCount}`;
};

function setData(){

  let pseudo = document.getElementById('pseudo').value;
  localStorage.setItem('nom', pseudo);
};

name();
visit();

document.cookie = "pseudo=Juju";