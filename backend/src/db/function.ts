import prisma from ".";


interface Metrics {
    img?:boolean,
    nft?:boolean,
    token?:boolean
}

async function dbMetricsUpdate(name:string,metrics?:Metrics){
    try {
        const user=await prisma.user.findUnique({
            where:{
                name:name
            }
        });
       
       if(!user){
        throw new Error("user not found")
       }

//Fetches the current imgUses value from the database using user.imgUses
     if(metrics?.img===true){
       const update= await prisma.user.update({
            where:{
                name:name
            },
            data:{
              imgUses:user.imgUses +1
            }
            
        })

        console.log("update result for the img:",update);
     }

     if(metrics?.nft===true){
        await prisma.user.update({
            where:{
                name:name
            },data:{
                nftminted:user.nftminted +1
            }
        })
     }

     if(metrics?.token===true){
        await prisma.user.update({
            where:{
                name:name
            },
            data:{
                tokenminted:user.tokenminted +1
            }
        })
     }

    } catch (error) {
    console.log("no user found  ");
    addUser(name);
    }
}

//if user does not exists we will create user 
export async function addUser(name:string){
   try {
     const user=await prisma.user.create({
        data:{
            name:name
        }
     })
       return user;

   } catch (error:any) {
    if(error.code==="P2002"){
        return  
    }
    console.log(error.code)
   }

}

export async function getImage(name:string){
   try {
     const user=await prisma.user.findUnique({
    where:{
        name:name
    }
    })

    if(!user){
        return -1
    }else if (user){
        return user.imgUses
    }

   } catch (error) {
    console.log(error)
   }
}


export async function isWallet(name:string){
    try {
     await prisma.user.update({
        where:{
            name:name
        },data:{
            isWallet:true
        }
      })
    } catch (error) {
        console.log(error)
    }
}

export async function getIsWallet(name:string){
    try {
     const user= await prisma.user.findUnique({
        where:{
            name:name
        }
     })
     return user
    } catch (error) {
         console.log(error)
    }
}

export async function  setWallet(name:string,walletaddress:string,walletprivatekey:string){ 

    try {
    const response=await prisma.user.update({
        where:{
            name:name
        },data:{
           walletaddress:walletaddress,
           walletSecretkey:walletprivatekey
        }
    })
    
    if(response){
        return 1
    }else {
        return 0
    }
    } catch (error) {
         console.log(error)
         return  0;
    } 
    
}

export default dbMetricsUpdate;